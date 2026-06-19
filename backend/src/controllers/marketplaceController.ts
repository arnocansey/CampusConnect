import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createStore = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { storeName, storeDescription } = req.body;

  if (!storeName || storeName.trim().length < 2) {
    throw new AppError('Store name is required (min 2 characters)', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hasStore: true } });
  if (user?.hasStore) throw new AppError('Store already exists', 409);

  await prisma.user.update({
    where: { id: userId },
    data: {
      hasStore: true,
      storeName: storeName.trim(),
      storeDescription: storeDescription?.trim() || null,
      storeCreatedAt: new Date(),
    },
  });

  // Auto-assign Free plan
  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Free', isActive: true } });
  if (freePlan) {
    const existing = await prisma.userSubscription.findFirst({ where: { userId } });
    if (!existing) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + freePlan.durationDays);
      await prisma.userSubscription.create({
        data: {
          userId,
          planId: freePlan.id,
          status: 'ACTIVE',
          adsRemaining: freePlan.adLimit,
          adsUsed: 0,
          expiresAt,
        },
      });
    }
  }

  res.status(201).json({ success: true, message: 'Store created! Free plan activated.' });
};

export const getMyStore = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { hasStore: true, storeName: true, storeDescription: true, storeCreatedAt: true },
  });
  res.json({ success: true, data: user });
};

export const createMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  // Check store
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { hasStore: true } });
  if (!user?.hasStore) {
    throw new AppError('You must create a store before posting items. Visit My Shop to set up your store.', 403);
  }

  // Check subscription
  const { checkMarketplaceAccess } = await import('./subscriptionController');
  const access = await checkMarketplaceAccess(req.user!.id);
  if (!access.canPost) {
    if (access.reason === 'no_subscription') {
      throw new AppError('You need an active subscription to post items. Please choose a plan.', 403);
    }
    if (access.reason === 'ads_exhausted') {
      throw new AppError('You have used all your ad slots. Please renew your subscription.', 403);
    }
  }

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

  // Decrement subscription ads remaining
  if (access.subscription && access.subscription.adsRemaining !== -1) {
    await prisma.userSubscription.update({
      where: { id: access.subscription.id },
      data: {
        adsRemaining: { decrement: 1 },
        adsUsed: { increment: 1 },
      },
    });
  }
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

export const getUserMarketplaceItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const where: any = {
    sellerId: user.id,
    isAvailable: true,
    isSold: false,
    isApproved: true,
  };

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
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.marketplaceItem.count({ where });

  res.json({
    success: true,
    data: items,
    total,
    page: parseInt(page as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
};

export const getSellerStorefront = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      profilePicture: true,
      bio: true,
      isVerified: true,
      isPremiumSeller: true,
      hasStore: true,
      storeName: true,
      storeDescription: true,
      storeCreatedAt: true,
      createdAt: true,
      university: { select: { name: true } },
    },
  });

  if (!user) throw new AppError('Seller not found', 404);
  if (!user.hasStore) throw new AppError('This user has not created a store yet', 404);

  const [items, reviewStats, totalSold, subscription] = await Promise.all([
    prisma.marketplaceItem.findMany({
      where: { sellerId: user.id, isAvailable: true, isSold: false, isApproved: true },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.marketplaceReview.aggregate({
      where: { sellerId: user.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.marketplaceItem.count({
      where: { sellerId: user.id, isSold: true },
    }),
    prisma.userSubscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: { plan: { select: { name: true } } },
    }),
  ]);

  const recentReviews = await prisma.marketplaceReview.findMany({
    where: { sellerId: user.id },
    include: {
      reviewer: { select: { id: true, username: true, fullName: true, profilePicture: true } },
      item: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  res.json({
    success: true,
    data: {
      seller: user,
      items,
      stats: {
        totalListings: items.length,
        totalSold,
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: reviewStats._count.rating,
      },
      subscription: subscription ? { plan: subscription.plan.name } : null,
      recentReviews,
    },
  });
};

export const getSellerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [items, soldItems, reviewStats, subscription, recentReviews] = await Promise.all([
    prisma.marketplaceItem.findMany({
      where: { sellerId: userId, isAvailable: true, isSold: false, isApproved: true },
      include: { _count: { select: { reviews: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.marketplaceItem.findMany({
      where: { sellerId: userId, isSold: true },
      select: { id: true, title: true, price: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.marketplaceReview.aggregate({
      where: { sellerId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.userSubscription.findFirst({
      where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: { plan: { select: { name: true, adLimit: true } } },
    }),
    prisma.marketplaceReview.findMany({
      where: { sellerId: userId },
      include: {
        reviewer: { select: { id: true, username: true, fullName: true, profilePicture: true } },
        item: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    success: true,
    data: {
      activeListings: items,
      soldItems,
      stats: {
        totalActive: items.length,
        totalSold: soldItems.length,
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: reviewStats._count.rating,
      },
      subscription: subscription
        ? {
            plan: subscription.plan.name,
            adsRemaining: subscription.adsRemaining === -1 ? -1 : subscription.adsRemaining,
            adsUsed: subscription.adsUsed,
            expiresAt: subscription.expiresAt,
          }
        : null,
      recentReviews,
    },
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
