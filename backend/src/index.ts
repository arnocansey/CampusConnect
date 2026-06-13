// import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { initializeSocket } from './sockets';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import noteRoutes from './routes/noteRoutes';
import groupRoutes from './routes/groupRoutes';
import hostelRoutes from './routes/hostelRoutes';
import jobRoutes from './routes/jobRoutes';
import eventRoutes from './routes/eventRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import storyRoutes from './routes/storyRoutes';
import adminRoutes from './routes/adminRoutes';
import aiChatRoutes from './routes/aiChatRoutes';
import announcementRoutes from './routes/announcementRoutes';

import prisma from './config/database';

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = initializeSocket(httpServer);

// Make io accessible to routes
app.set('io', io);

// Security
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploads locally
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public site settings (no auth)
app.get('/api/settings/public', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json({
      success: true,
      data: {
        siteName: map.siteName || 'CampusConnect',
        logoUrl: map.logoUrl || '',
      },
    });
  } catch {
    res.json({
      success: true,
      data: { siteName: 'CampusConnect', logoUrl: '' },
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiChatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`
  🚀 CampusConnect Backend Server
  ================================
  🌐 Environment: ${config.nodeEnv}
  📡 Server: http://localhost:${config.port}
  🔌 Socket.IO: Ready
  📦 API: http://localhost:${config.port}/api
  ================================
  `);
});

export default app;
