import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  username: string;
}

let onlineUsersMap: Map<string, string> = new Map();

export const getOnlineUsers = (): Map<string, string> => onlineUsersMap;

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const onlineUsers = onlineUsersMap;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).userId = user.id;
      (socket as any).username = user.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    console.log(`User connected: ${username} (${socket.id})`);

    onlineUsers.set(userId, socket.id);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() },
      });
    } catch (e) {
      console.error('Failed to update lastSeen:', e);
    }

    io.emit('user_online', { userId, isOnline: true });

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
    }) => {
      try {
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId,
            },
          },
        });

        if (!membership) return;

        const message = await prisma.message.create({
          data: {
            content: data.content,
            conversationId: data.conversationId,
            senderId: userId,
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
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${data.conversationId}`).emit('new_message', message);

        const otherMembers = await prisma.conversationMember.findMany({
          where: { conversationId: data.conversationId, userId: { not: userId } },
        });
        for (const member of otherMembers) {
          io.to(member.userId).emit('conversation_updated', { conversationId: data.conversationId });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        username,
        conversationId,
      });
    });

    socket.on('stop_typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId,
        conversationId,
      });
    });
    socket.on('mark_read', async (conversationId: string) => {
      try {
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (membership) {
          const updated = await prisma.conversationMember.update({
            where: { id: membership.id },
            data: { lastReadAt: new Date() },
          });

          io.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            userId,
            readAt: updated.lastReadAt,
          });
        }
      } catch (e) {
        console.error('Error marking read:', e);
      }
    });

    socket.on('react_message', async (data: {
      conversationId: string;
      messageId: string;
      emoji: string;
    }) => {
      try {
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId,
            },
          },
        });

        if (!membership) return;

        const existingReaction = await prisma.messageReaction.findUnique({
          where: {
            messageId_userId: {
              messageId: data.messageId,
              userId,
            },
          },
        });

        let action: 'add' | 'remove' = 'add';

        if (existingReaction) {
          if (existingReaction.emoji === data.emoji) {
            await prisma.messageReaction.delete({
              where: { id: existingReaction.id },
            });
            action = 'remove';
          } else {
            await prisma.messageReaction.update({
              where: { id: existingReaction.id },
              data: { emoji: data.emoji },
            });
            action = 'add';
          }
        } else {
          await prisma.messageReaction.create({
            data: {
              messageId: data.messageId,
              userId,
              emoji: data.emoji,
            },
          });
          action = 'add';
        }

        io.to(`conversation:${data.conversationId}`).emit('message_reaction_updated', {
          conversationId: data.conversationId,
          messageId: data.messageId,
          userId,
          username,
          emoji: data.emoji,
          action,
        });
      } catch (error) {
        console.error('Error reacting to message:', error);
      }
    });
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${username} (${socket.id})`);
      onlineUsers.delete(userId);

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() },
        });
      } catch (e) {
        console.error('Failed to update lastSeen on disconnect:', e);
      }

      io.emit('user_online', { userId, isOnline: false });
    });
  });

  return io;
};
