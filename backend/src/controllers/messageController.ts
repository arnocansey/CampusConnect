import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { sendPushNotification } from '../services/notificationService';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId: req.user!.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              profilePicture: true,
              lastSeen: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const formattedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const otherMember = conv.members.find((m) => m.userId !== req.user!.id);
      const lastMessage = conv.messages[0];
      const currentUserMember = conv.members.find((m) => m.userId === req.user!.id);

      let unreadCount = 0;
      if (currentUserMember) {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: req.user!.id },
            createdAt: { gt: currentUserMember.lastReadAt },
          },
        });
      }

      return {
        id: conv.id,
        name: conv.isGroup ? conv.name : otherMember?.user.fullName,
        avatar: conv.isGroup ? conv.avatar : otherMember?.user.profilePicture,
        isGroup: conv.isGroup,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              sender: lastMessage.sender.username,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    })
  );

  res.json({
    success: true,
    data: formattedConversations,
  });
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, isGroup, name } = req.body;

  if (isGroup) {
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name,
        members: {
          create: {
            userId: req.user!.id,
          },
        },
      },
      include: {
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
        },
      },
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
    return;
  }

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: req.user!.id } } },
        { members: { some: { userId } } },
      ],
    },
    include: {
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
      },
    },
  });

  if (existingConversation) {
    res.json({
      success: true,
      data: existingConversation,
    });
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: req.user!.id },
          { userId },
        ],
      },
    },
    include: {
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
      },
    },
  });

  res.status(201).json({
    success: true,
    data: conversation,
  });
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const { page = '1', limit = '50' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this conversation', 403);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              profilePicture: true,
              lastSeen: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: {
      userId: true,
      lastReadAt: true,
    },
  });

  const now = new Date();
  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { lastReadAt: now },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conversationId}`).emit('messages_read', {
      conversationId,
      userId: req.user!.id,
      readAt: now,
    });
  }

  const otherMember = conversation.members.find((m) => m.userId !== req.user!.id);
  const convName = conversation.isGroup ? conversation.name : otherMember?.user.fullName;
  const convAvatar = conversation.isGroup ? conversation.avatar : otherMember?.user.profilePicture;

  const formattedMessages = messages.reverse().map((msg) => {
    const readByUserIds = members
      .filter((m) => m.userId !== msg.senderId && m.lastReadAt >= msg.createdAt)
      .map((m) => m.userId);

    return {
      ...msg,
      readBy: readByUserIds,
    };
  });

  res.json({
    success: true,
    data: {
      messages: formattedMessages,
      conversation: {
        id: conversation.id,
        name: convName,
        avatar: convAvatar,
        isGroup: conversation.isGroup,
        members: conversation.members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          fullName: m.user.fullName,
          profilePicture: m.user.profilePicture,
          lastSeen: m.user.lastSeen,
        })),
      },
    },
  });
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { conversationId, content } = req.body;

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this conversation', 403);
  }

  let imageUrl: string | undefined;
  if (req.file) {
    const { uploadImage } = require('../utils/cloudinary');
    imageUrl = await uploadImage(req.file, 'campusconnect/messages');
  }

  const message = await prisma.message.create({
    data: {
      content,
      imageUrl,
      conversationId,
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

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const otherMembers = await prisma.conversationMember.findMany({
    where: {
      conversationId,
      userId: { not: req.user!.id },
    },
  });

  for (const member of otherMembers) {
    await prisma.notification.create({
      data: {
        type: 'MESSAGE',
        content: `${req.user!.username} sent you a message`,
        userId: member.userId,
        senderId: req.user!.id,
        link: `/messages/${conversationId}`,
      },
    });

    sendPushNotification(member.userId, {
      title: `@${req.user!.username}`,
      body: content || (imageUrl ? '📷 Sent an image' : 'Sent a message'),
      link: `/messages/${conversationId}`,
    }).catch((err) => console.error('Failed to dispatch push notification:', err));
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`conversation:${conversationId}`).emit('new_message', {
      ...message,
      reactions: [],
      readBy: [],
    });
  }

  res.status(201).json({
    success: true,
    data: message,
  });
};
