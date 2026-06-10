import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const { content, parentId } = req.body;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parentComment) {
      throw new AppError('Parent comment not found', 404);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: req.user!.id,
      postId,
      parentId,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });

  if (post.authorId !== req.user!.id) {
    await prisma.notification.create({
      data: {
        type: 'COMMENT',
        content: `${req.user!.username} commented on your post`,
        userId: post.authorId,
        senderId: req.user!.id,
        link: `/post/${postId}`,
      },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: comment,
  });
};

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              profilePicture: true,
              isVerified: true,
            },
          },
          _count: {
            select: { likes: true },
          },
          ...(req.user
            ? {
                likes: {
                  where: { userId: req.user.id },
                  select: { id: true },
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: 3,
      },
      likes: req.user
        ? {
            where: { userId: req.user.id },
            select: { id: true },
          }
        : false,
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.comment.count({
    where: { postId, parentId: null },
  });

  res.json({
    success: true,
    data: {
      comments: comments.map((c) => ({
        ...c,
        isLiked: c.likes?.length > 0,
        likes: undefined,
        replies: c.replies?.map((r: any) => ({
          ...r,
          isLiked: r.likes?.length > 0,
          likes: undefined,
        })),
      })),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.authorId !== req.user!.id && req.user!.role === 'STUDENT') {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  await prisma.comment.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
};
