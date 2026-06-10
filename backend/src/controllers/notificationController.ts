import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    skip,
    take: parseInt(limit as string),
  });

  const total = await prisma.notification.count({
    where: { userId: req.user!.id },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: req.user!.id,
      isRead: false,
    },
  });

  res.json({
    success: true,
    data: {
      notifications,
      total,
      unreadCount,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user!.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
};
