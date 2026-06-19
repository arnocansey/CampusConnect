import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const PLATFORM_FEE_PERCENT = 10;

// ==================== FEATURED LISTINGS ====================

export const featureMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { durationDays = 7 } = req.body;

  const item = await prisma.marketplaceItem.findUnique({ where: { id }, select: { sellerId: true, isFeatured: true } });
  if (!item) throw new AppError('Item not found', 404);

  if (item.sellerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Not authorized', 403);
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.marketplaceItem.update({
    where: { id },
    data: { isFeatured: true, featuredAt: now, featuredExpiry: expiry },
  });

  res.json({ success: true, data: updated });
};

export const unfeatureMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updated = await prisma.marketplaceItem.update({
    where: { id },
    data: { isFeatured: false, featuredAt: null, featuredExpiry: null },
  });
  res.json({ success: true, data: updated });
};

export const getFeaturedItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const items = await prisma.marketplaceItem.findMany({
    where: {
      isFeatured: true,
      isAvailable: true,
      isSold: false,
      isApproved: true,
      featuredExpiry: { gt: now },
    },
    include: {
      seller: { select: { id: true, username: true, fullName: true, profilePicture: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { featuredAt: 'desc' },
    take: 10,
  });
  res.json({ success: true, data: items });
};

// ==================== BANNER ADS ====================

export const createBannerAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, linkUrl, position, startDate, endDate } = req.body;
  let imageUrl = '';

  if (req.file) {
    const { uploadImage } = await import('../utils/cloudinary');
    imageUrl = await uploadImage(req.file, 'campusconnect/banners');
  }

  const ad = await prisma.bannerAd.create({
    data: {
      title,
      imageUrl,
      linkUrl,
      position: position || 'SIDEBAR',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      advertiserId: req.user!.id,
    },
  });

  res.status(201).json({ success: true, data: ad });
};

export const getActiveBannerAds = async (req: AuthRequest, res: Response): Promise<void> => {
  const { position } = req.query;
  const now = new Date();

  const where: any = {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
  };
  if (position) where.position = position;

  const ads = await prisma.bannerAd.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Track impressions
  for (const ad of ads) {
    await prisma.bannerAd.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } });
  }

  res.json({ success: true, data: ads });
};

export const trackBannerClick = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.bannerAd.update({ where: { id }, data: { clicks: { increment: 1 } } });
  res.json({ success: true });
};

export const getAllBannerAds = async (req: AuthRequest, res: Response): Promise<void> => {
  const ads = await prisma.bannerAd.findMany({
    include: { advertiser: { select: { id: true, fullName: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: ads });
};

export const updateBannerAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, linkUrl, position, isActive, startDate, endDate } = req.body;

  const data: any = {};
  if (title) data.title = title;
  if (linkUrl !== undefined) data.linkUrl = linkUrl;
  if (position) data.position = position;
  if (isActive !== undefined) data.isActive = isActive;
  if (startDate) data.startDate = new Date(startDate);
  if (endDate) data.endDate = new Date(endDate);

  if (req.file) {
    const { uploadImage } = await import('../utils/cloudinary');
    data.imageUrl = await uploadImage(req.file, 'campusconnect/banners');
  }

  const ad = await prisma.bannerAd.update({ where: { id }, data });
  res.json({ success: true, data: ad });
};

export const deleteBannerAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.bannerAd.delete({ where: { id } });
  res.json({ success: true, message: 'Banner ad deleted' });
};

// ==================== PREMIUM PROFILES ====================

export const becomePremiumSeller = async (req: AuthRequest, res: Response): Promise<void> => {
  const { durationDays = 30 } = req.body;
  const now = new Date();
  const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { isPremiumSeller: true, premiumExpiry: expiry },
    select: { id: true, isPremiumSeller: true, premiumExpiry: true },
  });

  res.json({ success: true, data: user });
};

export const getPremiumStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { isPremiumSeller: true, premiumExpiry: true },
  });
  res.json({ success: true, data: user });
};

export const getAllPremiumSellers = async (req: AuthRequest, res: Response): Promise<void> => {
  const sellers = await prisma.user.findMany({
    where: { isPremiumSeller: true },
    select: { id: true, username: true, fullName: true, profilePicture: true, premiumExpiry: true },
    orderBy: { premiumExpiry: 'desc' },
  });
  res.json({ success: true, data: sellers });
};

export const revokePremiumSeller = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.user.update({
    where: { id },
    data: { isPremiumSeller: false, premiumExpiry: null },
  });
  res.json({ success: true, message: 'Premium status revoked' });
};

// ==================== NOTES MARKETPLACE ====================

export const purchaseNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const buyerId = req.user!.id;

  const note = await prisma.note.findUnique({
    where: { id },
    include: { uploader: { select: { id: true } } },
  });
  if (!note) throw new AppError('Note not found', 404);
  if (!note.isPaid || note.price <= 0) throw new AppError('This note is free', 400);
  if (note.uploaderId === buyerId) throw new AppError('Cannot purchase your own note', 400);

  const existing = await prisma.notePurchase.findUnique({
    where: { noteId_buyerId: { noteId: id, buyerId } },
  });
  if (existing) throw new AppError('Already purchased', 409);

  const platformFee = note.price * (PLATFORM_FEE_PERCENT / 100);
  const uploaderEarning = note.price - platformFee;

  const purchase = await prisma.notePurchase.create({
    data: {
      noteId: id,
      buyerId,
      amount: note.price,
      platformFee,
      uploaderEarning,
      status: 'SUCCESS',
    },
  });

  res.status(201).json({ success: true, data: purchase });
};

export const checkNotePurchased = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const purchase = await prisma.notePurchase.findUnique({
    where: { noteId_buyerId: { noteId: id, buyerId: req.user!.id } },
  });
  res.json({ success: true, data: { purchased: !!purchase } });
};

export const getNoteEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [purchases, totals] = await Promise.all([
    prisma.notePurchase.findMany({
      where: { note: { uploaderId: userId }, status: 'SUCCESS' },
      include: {
        buyer: { select: { id: true, fullName: true, username: true } },
        note: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notePurchase.aggregate({
      where: { note: { uploaderId: userId }, status: 'SUCCESS' },
      _sum: { uploaderEarning: true, platformFee: true, amount: true },
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      purchases,
      totals: {
        totalEarnings: totals._sum.uploaderEarning || 0,
        totalPlatformFees: totals._sum.platformFee || 0,
        totalRevenue: totals._sum.amount || 0,
        totalSales: totals._count,
      },
    },
  });
};

// ==================== EVENT TICKETING ====================

export const purchaseEventTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { quantity = 1 } = req.body;
  const buyerId = req.user!.id;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId === buyerId) throw new AppError('Cannot buy ticket for your own event', 400);

  if (event.maxAttendees) {
    const totalRegistered = await prisma.eventTicket.count({
      where: { eventId: id, status: 'SUCCESS' },
    });
    if (totalRegistered + quantity > event.maxAttendees) {
      throw new AppError('Not enough tickets available', 400);
    }
  }

  const totalAmount = event.ticketPrice * quantity;
  const platformFee = totalAmount * (PLATFORM_FEE_PERCENT / 100);
  const organizerEarning = totalAmount - platformFee;

  const ticket = await prisma.eventTicket.create({
    data: {
      eventId: id,
      buyerId,
      quantity,
      totalAmount,
      platformFee,
      organizerEarning,
      status: 'SUCCESS',
    },
  });

  res.status(201).json({ success: true, data: ticket });
};

export const getEventTicketSales = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [tickets, totals] = await Promise.all([
    prisma.eventTicket.findMany({
      where: { event: { organizerId: userId }, status: 'SUCCESS' },
      include: {
        buyer: { select: { id: true, fullName: true, username: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.eventTicket.aggregate({
      where: { event: { organizerId: userId }, status: 'SUCCESS' },
      _sum: { organizerEarning: true, platformFee: true, totalAmount: true },
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      tickets,
      totals: {
        totalEarnings: totals._sum.organizerEarning || 0,
        totalPlatformFees: totals._sum.platformFee || 0,
        totalRevenue: totals._sum.totalAmount || 0,
        totalTicketsSold: totals._count,
      },
    },
  });
};

export const checkEventTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const ticket = await prisma.eventTicket.findFirst({
    where: { eventId: id, buyerId: req.user!.id, status: 'SUCCESS' },
  });
  res.json({ success: true, data: { hasTicket: !!ticket, ticket } });
};

// ==================== HOSTEL BOOKINGS ====================

export const bookHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { checkIn, checkOut, contactPhone } = req.body;
  const studentId = req.user!.id;

  const hostel = await prisma.hostel.findUnique({ where: { id } });
  if (!hostel) throw new AppError('Hostel not found', 404);

  const months = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months < 1) throw new AppError('Minimum booking is 1 month', 400);

  const monthlyRent = hostel.pricePerMonth;
  const totalRent = monthlyRent * months;
  const platformCommission = totalRent * (PLATFORM_FEE_PERCENT / 100);

  const booking = await prisma.hostelBooking.create({
    data: {
      hostelId: id,
      studentId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      monthlyRent,
      platformCommission,
      contactPhone,
      status: 'CONFIRMED',
    },
    include: { hostel: { select: { id: true, name: true, location: true } } },
  });

  res.status(201).json({ success: true, data: booking });
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const bookings = await prisma.hostelBooking.findMany({
    where: { studentId: req.user!.id },
    include: { hostel: { select: { id: true, name: true, location: true, images: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: bookings });
};

export const getHostelBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const bookings = await prisma.hostelBooking.findMany({
    where: { hostelId: id },
    include: { student: { select: { id: true, fullName: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: bookings });
};

// ==================== REVENUE DASHBOARD ====================

export const getPlatformRevenue = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    noteFees,
    ticketFees,
    hostelCommissions,
    recentNoteFees,
    recentTicketFees,
    recentHostelCommissions,
  ] = await Promise.all([
    prisma.notePurchase.aggregate({ where: { status: 'SUCCESS' }, _sum: { platformFee: true }, _count: true }),
    prisma.eventTicket.aggregate({ where: { status: 'SUCCESS' }, _sum: { platformFee: true }, _count: true }),
    prisma.hostelBooking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { platformCommission: true }, _count: true }),
    prisma.notePurchase.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } }, _sum: { platformFee: true } }),
    prisma.eventTicket.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } }, _sum: { platformFee: true } }),
    prisma.hostelBooking.aggregate({ where: { status: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } }, _sum: { platformCommission: true } }),
  ]);

  const totalRevenue =
    (noteFees._sum.platformFee || 0) +
    (ticketFees._sum.platformFee || 0) +
    (hostelCommissions._sum.platformCommission || 0);

  const monthlyRevenue =
    (recentNoteFees._sum.platformFee || 0) +
    (recentTicketFees._sum.platformFee || 0) +
    (recentHostelCommissions._sum.platformCommission || 0);

  res.json({
    success: true,
    data: {
      totalRevenue,
      monthlyRevenue,
      breakdown: {
        notes: { total: noteFees._sum.platformFee || 0, count: noteFees._count, label: 'Notes Marketplace' },
        tickets: { total: ticketFees._sum.platformFee || 0, count: ticketFees._count, label: 'Event Ticketing' },
        hostels: { total: hostelCommissions._sum.platformCommission || 0, count: hostelCommissions._count, label: 'Hostel Bookings' },
      },
      platformFeePercent: PLATFORM_FEE_PERCENT,
    },
  });
};
