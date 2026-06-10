import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalPosts,
    totalNotes,
    totalGroups,
    totalMarketplaceItems,
    totalEvents,
    pendingReports,
    newUsersToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.note.count(),
    prisma.studyGroup.count(),
    prisma.marketplaceItem.count(),
    prisma.event.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalPosts,
      totalNotes,
      totalGroups,
      totalMarketplaceItems,
      totalEvents,
      pendingReports,
      newUsersToday,
    },
  });
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', search, role } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: { posts: true, followers: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count({ where });

  res.json({
    success: true,
    data: {
      users,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['STUDENT', 'MODERATOR', 'ADMIN'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true },
  });

  res.json({
    success: true,
    message: 'User role updated',
    data: user,
  });
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  await prisma.adminAction.create({
    data: {
      action: 'SUSPEND',
      targetType: 'USER',
      targetId: id,
      reason,
      adminId: req.user!.id,
    },
  });

  res.json({
    success: true,
    message: 'User suspended',
  });
};

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.report.count({ where });

  res.json({
    success: true,
    data: {
      reports,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const resolveReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['RESOLVED', 'DISMISSED'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const report = await prisma.report.update({
    where: { id },
    data: {
      status,
      resolvedBy: req.user!.id,
      resolvedAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Report resolved',
    data: report,
  });
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason, description, contentType, contentId, reportedUserId } = req.body;

  const report = await prisma.report.create({
    data: {
      reason,
      description,
      contentType,
      contentId,
      reporterId: req.user!.id,
      reportedUserId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted',
    data: report,
  });
};
