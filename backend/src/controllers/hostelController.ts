import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, location, latitude, longitude, pricePerMonth, currency, roomType, facilities, contactPhone, contactEmail } = req.body;
  const images: string[] = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const url = await uploadImage(file, 'campusconnect/hostels');
      images.push(url);
    }
  }

  let facilitiesList: string[] = [];
  if (facilities) {
    if (typeof facilities === 'string') {
      try {
        facilitiesList = JSON.parse(facilities);
      } catch (e) {
        facilitiesList = [facilities];
      }
    } else if (Array.isArray(facilities)) {
      facilitiesList = facilities;
    }
  }

  const hostel = await prisma.hostel.create({
    data: {
      name,
      description,
      images,
      location,
      latitude: latitude ? parseFloat(latitude as string) : null,
      longitude: longitude ? parseFloat(longitude as string) : null,
      pricePerMonth: typeof pricePerMonth === 'string' ? parseFloat(pricePerMonth) : pricePerMonth,
      currency: currency || 'USD',
      roomType,
      facilities: facilitiesList,
      contactPhone,
      contactEmail,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Hostel listed successfully',
    data: hostel,
  });
};

export const getHostels = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', roomType, minPrice, maxPrice, search } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};

  if (roomType) where.roomType = roomType;
  if (minPrice) where.pricePerMonth = { gte: parseFloat(minPrice as string) };
  if (maxPrice) {
    where.pricePerMonth = { ...where.pricePerMonth, lte: parseFloat(maxPrice as string) };
  }
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { location: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const hostels = await prisma.hostel.findMany({
    where,
    include: {
      _count: {
        select: { reviews: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.hostel.count({ where });

  res.json({
    success: true,
    data: {
      hostels,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const hostel = await prisma.hostel.findUnique({
    where: { id },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
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

  if (!hostel) {
    throw new AppError('Hostel not found', 404);
  }

  const avgRating = await prisma.hostelReview.aggregate({
    where: { hostelId: id },
    _avg: { rating: true },
  });

  res.json({
    success: true,
    data: {
      ...hostel,
      averageRating: avgRating._avg.rating || 0,
    },
  });
};

export const reviewHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const hostel = await prisma.hostel.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!hostel) {
    throw new AppError('Hostel not found', 404);
  }

  const existingReview = await prisma.hostelReview.findUnique({
    where: {
      userId_hostelId: {
        userId: req.user!.id,
        hostelId: id,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this hostel', 409);
  }

  const review = await prisma.hostelReview.create({
    data: {
      rating,
      comment,
      hostelId: id,
      userId: req.user!.id,
    },
    include: {
      user: {
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
