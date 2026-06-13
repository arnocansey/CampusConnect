import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, price, currency, category, condition, location } = req.body;
  const images: string[] = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const url = await uploadImage(file, 'campusconnect/marketplace');
      images.push(url);
    }
  }

  const item = await prisma.marketplaceItem.create({
    data: {
      title,
      description,
      price: typeof price === 'string' ? parseFloat(price) : price,
      currency,
      category,
      condition,
      location,
      images,
      sellerId: req.user!.id,
    },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Item listed successfully',
    data: item,
  });
};

export const getMarketplaceItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', category, search, sort = 'createdAt', order = 'desc', sellerId } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    isAvailable: true,
    isSold: false,
    isApproved: true,
  };

  if (sellerId) {
    where.sellerId = sellerId as string;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    const terms = (search as string).split(/\s+/).filter(Boolean);
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      ...terms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ]),
    ];
  }

  const items = await prisma.marketplaceItem.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { reviews: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { [sort as string]: order },
  });

  const total = await prisma.marketplaceItem.count({ where });

  res.json({
    success: true,
    data: {
      items,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          isVerified: true,
        },
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  const avgRating = await prisma.marketplaceReview.aggregate({
    where: { itemId: id },
    _avg: { rating: true },
  });

  res.json({
    success: true,
    data: {
      ...item,
      averageRating: avgRating._avg.rating || 0,
    },
  });
};

export const updateMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, price, category, condition, location, isAvailable, isSold } = req.body;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.sellerId !== req.user!.id) {
    throw new AppError('Not authorized to update this item', 403);
  }

  const updated = await prisma.marketplaceItem.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(price && { price }),
      ...(category && { category }),
      ...(condition && { condition }),
      ...(location !== undefined && { location }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(isSold !== undefined && { isSold }),
    },
  });

  res.json({
    success: true,
    message: 'Item updated successfully',
    data: updated,
  });
};

export const deleteMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.sellerId !== req.user!.id && req.user!.role === 'STUDENT') {
    throw new AppError('Not authorized to delete this item', 403);
  }

  await prisma.marketplaceItem.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
};

export const reviewMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id },
    select: { sellerId: true },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.sellerId === req.user!.id) {
    throw new AppError('Cannot review your own item', 400);
  }

  const existingReview = await prisma.marketplaceReview.findUnique({
    where: {
      reviewerId_itemId: {
        reviewerId: req.user!.id,
        itemId: id,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this item', 409);
  }

  const review = await prisma.marketplaceReview.create({
    data: {
      rating,
      comment,
      reviewerId: req.user!.id,
      sellerId: item.sellerId,
      itemId: id,
    },
    include: {
      reviewer: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review,
  });
};
