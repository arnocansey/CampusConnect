import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createStory = async (req: AuthRequest, res: Response): Promise<void> => {
  let imageUrl: string | undefined;
  const { content, backgroundColor } = req.body;

  if (req.file) {
    imageUrl = await uploadImage(req.file, 'campusconnect/stories');
  } else if (!content || !content.trim()) {
    throw new AppError('Either an image or text content is required to create a story', 400);
  }

  const story = await prisma.story.create({
    data: {
      imageUrl: imageUrl || null,
      backgroundColor: backgroundColor || null,
      content: content || null,
      authorId: req.user!.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Story created',
    data: story,
  });
};

export const getStories = async (req: AuthRequest, res: Response): Promise<void> => {
  const followingIds = req.user
    ? (
        await prisma.follow.findMany({
          where: { followerId: req.user.id },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : [];

  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      OR: [
        { authorId: { in: followingIds } },
        { authorId: req.user?.id },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      views: req.user
        ? {
            where: { viewerId: req.user.id },
            select: { id: true },
          }
        : false,
      _count: {
        select: { views: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: stories.map((s) => ({
      ...s,
      isViewed: s.views?.length > 0,
      views: undefined,
    })),
  });
};

export const viewStory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, expiresAt: true },
  });

  if (!story) {
    throw new AppError('Story not found', 404);
  }

  if (story.expiresAt < new Date()) {
    throw new AppError('Story has expired', 410);
  }

  const existingView = await prisma.storyView.findUnique({
    where: {
      storyId_viewerId: {
        storyId: id,
        viewerId: req.user!.id,
      },
    },
  });

  if (!existingView) {
    await prisma.storyView.create({
      data: {
        storyId: id,
        viewerId: req.user!.id,
      },
    });
  }

  res.json({
    success: true,
    message: 'Story viewed',
  });
};

export const deleteStory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const story = await prisma.story.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!story) {
    throw new AppError('Story not found', 404);
  }

  if (story.authorId !== req.user!.id) {
    throw new AppError('Not authorized to delete this story', 403);
  }

  await prisma.story.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Story deleted',
  });
};
