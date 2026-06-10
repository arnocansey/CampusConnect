import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, type = 'TEXT', tags } = req.body;
  const images: string[] = [];

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const url = await uploadImage(file, 'campusconnect/posts');
      images.push(url);
    }
  }

  const post = await prisma.post.create({
    data: {
      content,
      type: images.length > 0 ? 'IMAGE' : type,
      images,
      tags: tags || [],
      authorId: req.user!.id,
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
          comments: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: post,
  });
};

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', authorId } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const followingIds = req.user
    ? (
        await prisma.follow.findMany({
          where: { followerId: req.user.id },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : [];

  const where: any = { isDeleted: false };

  if (authorId) {
    where.authorId = authorId as string;
  } else {
    where.OR = [
      { authorId: { in: followingIds } },
      { author: { isVerified: true } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
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
          comments: true,
        },
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

  const total = await prisma.post.count({ where });

  res.json({
    success: true,
    data: {
      posts: posts.map((p) => ({
        ...p,
        isLiked: p.likes?.length > 0,
        likes: undefined,
      })),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
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
          comments: true,
        },
      },
      likes: req.user
        ? {
            where: { userId: req.user.id },
            select: { id: true },
          }
        : false,
    },
  });

  if (!post || post.isDeleted) {
    throw new AppError('Post not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...post,
      isLiked: post.likes?.length > 0,
      likes: undefined,
    },
  });
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorId !== req.user!.id && req.user!.role === 'STUDENT') {
    throw new AppError('Not authorized to delete this post', 403);
  }

  await prisma.post.update({
    where: { id },
    data: { isDeleted: true },
  });

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
};

export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: req.user!.id,
        postId: id,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });

    res.json({
      success: true,
      message: 'Post unliked',
      data: { isLiked: false },
    });
  } else {
    await prisma.like.create({
      data: {
        userId: req.user!.id,
        postId: id,
      },
    });

    if (post.authorId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          content: `${req.user!.username} liked your post`,
          userId: post.authorId,
          senderId: req.user!.id,
          link: `/post/${id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Post liked',
      data: { isLiked: true },
    });
  }
};

export const savePost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const existingSave = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId: req.user!.id,
        postId: id,
      },
    },
  });

  if (existingSave) {
    await prisma.savedPost.delete({ where: { id: existingSave.id } });

    res.json({
      success: true,
      message: 'Post unsaved',
      data: { isSaved: false },
    });
  } else {
    await prisma.savedPost.create({
      data: {
        userId: req.user!.id,
        postId: id,
      },
    });

    res.json({
      success: true,
      message: 'Post saved',
      data: { isSaved: true },
    });
  }
};

export const getSavedPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const savedPosts = await prisma.savedPost.findMany({
    where: { userId: req.user!.id },
    include: {
      post: {
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
              comments: true,
            },
          },
        },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: savedPosts.map((s) => s.post),
  });
};

export const getTrendingTopics = async (req: AuthRequest, res: Response): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: sevenDaysAgo },
      tags: { isEmpty: false },
    },
    select: { tags: true },
  });

  const tagCount: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }

  const trending = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  res.json({
    success: true,
    data: trending,
  });
};
