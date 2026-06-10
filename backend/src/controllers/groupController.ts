import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, course, department, level, isPublic, maxMembers } = req.body;

  const group = await prisma.studyGroup.create({
    data: {
      name,
      description,
      course,
      department,
      level,
      isPublic,
      maxMembers,
      creatorId: req.user!.id,
      members: {
        create: {
          userId: req.user!.id,
          role: 'ADMIN',
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Study group created',
    data: group,
  });
};

export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', search, course, department } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { isPublic: true };

  if (course) where.course = course;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const groups = await prisma.studyGroup.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.studyGroup.count({ where });

  res.json({
    success: true,
    data: {
      groups,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      members: {
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
        orderBy: { joinedAt: 'asc' },
      },
      _count: {
        select: { members: true, messages: true },
      },
    },
  });

  if (!group) {
    throw new AppError('Group not found', 404);
  }

  let membership = null;
  if (req.user) {
    membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: req.user.id,
        },
      },
    });
  }

  res.json({
    success: true,
    data: {
      ...group,
      isMember: !!membership,
      memberRole: membership?.role,
    },
  });
};

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    select: { id: true, maxMembers: true, isPublic: true, _count: { select: { members: true } } },
  });

  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: req.user!.id,
      },
    },
  });

  if (existingMember) {
    throw new AppError('Already a member of this group', 409);
  }

  if (group._count.members >= group.maxMembers) {
    throw new AppError('Group is full', 400);
  }

  await prisma.groupMember.create({
    data: {
      groupId: id,
      userId: req.user!.id,
    },
  });

  res.json({
    success: true,
    message: 'Joined group successfully',
  });
};

export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this group', 400);
  }

  if (membership.role === 'ADMIN') {
    throw new AppError('Group admin cannot leave. Transfer ownership first.', 400);
  }

  await prisma.groupMember.delete({ where: { id: membership.id } });

  res.json({
    success: true,
    message: 'Left group successfully',
  });
};

export const sendGroupMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { content } = req.body;

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this group', 403);
  }

  const message = await prisma.groupMessage.create({
    data: {
      content,
      groupId: id,
      senderId: req.user!.id,
    },
    include: {
      sender: {
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
    data: message,
  });
};

export const getGroupMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { page = '1', limit = '50' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this group', 403);
  }

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: id },
    include: {
      sender: {
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

  res.json({
    success: true,
    data: messages.reverse(),
  });
};
