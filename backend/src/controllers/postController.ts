import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage, uploadVideo } from '../utils/cloudinary';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, type = 'TEXT', tags, location, poll: pollData } = req.body;
  const images: string[] = [];
  let videoUrl: string | undefined;

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      if (file.mimetype.startsWith('video/')) {
        videoUrl = await uploadVideo(file, 'campusconnect/posts');
      } else {
        const url = await uploadImage(file, 'campusconnect/posts');
        images.push(url);
      }
    }
  }

  let determinedType = type;
  if (videoUrl) determinedType = 'VIDEO';
  else if (images.length > 0) determinedType = 'IMAGE';
  else if (pollData) determinedType = 'POLL';

  let parsedPoll: { options: string[]; expiresAt?: string } | null = null;
  if (pollData) {
    try {
      parsedPoll = typeof pollData === 'string' ? JSON.parse(pollData) : pollData;
    } catch {
      throw new AppError('Invalid poll data', 400);
    }
  }

  if (parsedPoll && (!parsedPoll.options || parsedPoll.options.length < 2 || parsedPoll.options.length > 6)) {
    throw new AppError('Poll must have 2-6 options', 400);
  }

  const post = await prisma.post.create({
    data: {
      content,
      type: determinedType,
      images,
      videoUrl,
      location: location || undefined,
      tags: tags || [],
      authorId: req.user!.id,
      ...(parsedPoll && {
        poll: {
          create: {
            options: {
              create: parsedPoll.options.map((text: string) => ({ text })),
            },
            expiresAt: parsedPoll.expiresAt ? new Date(parsedPoll.expiresAt) : undefined,
          },
        },
      }),
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
      poll: {
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
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
      savedPosts: req.user
        ? {
            where: { userId: req.user.id },
            select: { id: true },
          }
        : false,
      poll: {
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
          votes: req.user
            ? { where: { userId: req.user.id }, select: { optionId: true } }
            : false,
        },
      },
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
        isSaved: p.savedPosts?.length > 0,
        likes: undefined,
        savedPosts: undefined,
        poll: p.poll
          ? {
              ...p.poll,
              userVote: Array.isArray((p.poll as any).votes) ? (p.poll as any).votes[0]?.optionId : null,
              votes: undefined,
            }
          : null,
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
      savedPosts: req.user
        ? {
            where: { userId: req.user.id },
            select: { id: true },
          }
        : false,
      poll: {
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
          votes: req.user
            ? { where: { userId: req.user.id }, select: { optionId: true } }
            : false,
        },
      },
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
      isSaved: post.savedPosts?.length > 0,
      likes: undefined,
      savedPosts: undefined,
      poll: post.poll
        ? {
            ...post.poll,
            userVote: Array.isArray((post.poll as any).votes) ? (post.poll as any).votes[0]?.optionId : null,
            votes: undefined,
          }
        : null,
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

export const votePoll = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { optionId } = req.body;

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, type: true } });
  if (!post || post.type !== 'POLL') throw new AppError('Not a poll post', 400);

  const poll = await prisma.poll.findUnique({ where: { postId: id }, select: { id: true, expiresAt: true } });
  if (!poll) throw new AppError('Poll not found', 404);
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) throw new AppError('Poll has expired', 400);

  const option = await prisma.pollOption.findUnique({ where: { id: optionId }, select: { pollId: true } });
  if (!option || option.pollId !== poll.id) throw new AppError('Invalid poll option', 400);

  const existingVote = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId: poll.id, userId: req.user!.id } },
  });

  if (existingVote) {
    if (existingVote.optionId === optionId) {
      await prisma.pollVote.delete({ where: { id: existingVote.id } });
    } else {
      await prisma.pollVote.update({ where: { id: existingVote.id }, data: { optionId } });
    }
  } else {
    await prisma.pollVote.create({
      data: { pollId: poll.id, optionId, userId: req.user!.id },
    });
  }

  const updatedPoll = await prisma.poll.findUnique({
    where: { postId: id },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      votes: { where: { userId: req.user!.id }, select: { optionId: true } },
    },
  });

  res.json({
    success: true,
    data: {
      ...updatedPoll,
      userVote: updatedPoll?.votes[0]?.optionId || null,
      votes: undefined,
    },
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
