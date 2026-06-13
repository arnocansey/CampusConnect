import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage, deleteImage } from '../utils/cloudinary';
import { getOnlineUsers } from '../sockets';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      profilePicture: true,
      coverPhoto: true,
      coverGradient: true,
      bio: true,
      department: true,
      program: true,
      level: true,
      skills: true,
      interests: true,
      socialLinks: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let isFollowing = false;
  if (req.user) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  res.json({
    success: true,
    data: { ...user, isFollowing },
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, bio, department, program, level, skills, interests, socialLinks, coverGradient } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(fullName && { fullName }),
      ...(bio !== undefined && { bio }),
      ...(department !== undefined && { department }),
      ...(program !== undefined && { program }),
      ...(level !== undefined && { level }),
      ...(skills && { skills }),
      ...(interests && { interests }),
      ...(socialLinks && { socialLinks }),
      ...(coverGradient !== undefined && { coverGradient }),
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      profilePicture: true,
      coverPhoto: true,
      coverGradient: true,
      bio: true,
      department: true,
      program: true,
      level: true,
      skills: true,
      interests: true,
      socialLinks: true,
    },
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const imageUrl = await uploadImage(req.file, 'campusconnect/profiles');

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { profilePicture: imageUrl },
    select: { id: true, profilePicture: true },
  });

  res.json({
    success: true,
    message: 'Profile picture updated',
    data: user,
  });
};

export const uploadCoverPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const imageUrl = await uploadImage(req.file, 'campusconnect/covers');

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { coverPhoto: imageUrl },
    select: { id: true, coverPhoto: true },
  });

  res.json({
    success: true,
    message: 'Cover photo updated',
    data: user,
  });
};

export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (userId === req.user!.id) {
    throw new AppError('Cannot follow yourself', 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: req.user!.id,
        followingId: userId,
      },
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });

    res.json({
      success: true,
      message: 'Unfollowed successfully',
      data: { isFollowing: false },
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: req.user!.id,
        followingId: userId,
      },
    });

    const notification = await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        content: `${req.user!.username} started following you`,
        userId,
        senderId: req.user!.id,
        link: `/profile/${req.user!.username}`,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('notification_created', notification);
    }

    res.json({
      success: true,
      message: 'Followed successfully',
      data: { isFollowing: true },
    });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          department: true,
          isVerified: true,
        },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.follow.count({
    where: { followingId: user.id },
  });

  res.json({
    success: true,
    data: {
      followers: followers.map((f) => f.follower),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          department: true,
          isVerified: true,
        },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.follow.count({
    where: { followerId: user.id },
  });

  res.json({
    success: true,
    data: {
      following: following.map((f) => f.following),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q as string, mode: 'insensitive' } },
        { fullName: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      profilePicture: true,
      department: true,
      isVerified: true,
    },
    skip,
    take: parseInt(limit as string),
  });

  res.json({
    success: true,
    data: users,
  });
};

export const getSuggestedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const followingIds = (
    await prisma.follow.findMany({
      where: { followerId: req.user!.id },
      select: { followingId: true },
    })
  ).map((f) => f.followingId);

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user!.id, notIn: followingIds },
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      profilePicture: true,
      department: true,
      isVerified: true,
      _count: {
        select: { followers: true },
      },
    },
    take: 5,
    orderBy: { followers: { _count: 'desc' } },
  });

  res.json({
    success: true,
    data: users,
  });
};

export const updateFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fcmToken } = req.body;

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { fcmToken },
  });

  res.json({
    success: true,
    message: 'FCM Token updated successfully',
  });
};

export const getOnlineStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userIds } = req.body;
  const onlineUsers = getOnlineUsers();
  const status: Record<string, boolean> = {};

  for (const uid of userIds) {
    status[uid] = onlineUsers.has(uid);
  }

  res.json({
    success: true,
    data: status,
  });
};
