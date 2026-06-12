import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setMilliseconds(endOfLastWeek.getMilliseconds() - 1);

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalNotes,
    totalGroups,
    totalMarketplaceItems,
    totalEvents,
    totalJobs,
    pendingReports,
    newUsersToday,
    newUsersThisWeek,
    lastWeekUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeen: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.user.count({ where: { role: 'ADMIN', isVerified: false } }).catch(() => 0),
    prisma.note.count(),
    prisma.studyGroup.count(),
    prisma.marketplaceItem.count(),
    prisma.event.count(),
    prisma.job.count().catch(() => 0),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } } }),
  ]);

  let hostels = 0;
  try {
    hostels = await prisma.hostel.count();
  } catch { hostels = 0; }

  let universities = 0;
  try {
    universities = await prisma.university.count();
  } catch { universities = 0; }

  const lastWeekPosts = await prisma.post.count({
    where: { isDeleted: false, createdAt: { gte: startOfLastWeek, lt: startOfWeek } },
  }).catch(() => 0);
  const thisWeekPosts = await prisma.post.count({
    where: { isDeleted: false, createdAt: { gte: startOfWeek } },
  }).catch(() => 0);

  const lastWeekMarketplace = await prisma.marketplaceItem.count({
    where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } },
  }).catch(() => 0);
  const thisWeekMarketplace = await prisma.marketplaceItem.count({
    where: { createdAt: { gte: startOfWeek } },
  }).catch(() => 0);

  const userTrend = lastWeekUsers > 0
    ? `${(((newUsersThisWeek - lastWeekUsers) / lastWeekUsers) * 100).toFixed(0)}%`
    : lastWeekUsers === 0 && newUsersThisWeek > 0 ? '+100%' : '0%';
  const postTrend = lastWeekPosts > 0
    ? `${(((thisWeekPosts - lastWeekPosts) / lastWeekPosts) * 100).toFixed(0)}%`
    : '0%';
  const marketplaceTrend = lastWeekMarketplace > 0
    ? `${(((thisWeekMarketplace - lastWeekMarketplace) / lastWeekMarketplace) * 100).toFixed(0)}%`
    : '0%';

  const recentNotifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, profilePicture: true, username: true } },
    },
  }).catch(() => []);

  const recentActivity = recentNotifications.map((n) => ({
    user: { name: n.user.fullName, avatar: n.user.profilePicture, username: n.user.username },
    action: n.content,
    target: n.link || '',
    timestamp: n.createdAt,
  }));

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      universities,
      marketplaceListings: totalMarketplaceItems,
      notes: totalNotes,
      groups: totalGroups,
      hostels,
      jobs: totalJobs,
      events: totalEvents,
      pendingReports,
      bannedUsers,
      newUsersToday,
      newUsersThisWeek,
      totalRevenue: 0,
      recentActivity,
      trends: {
        totalUsers: userTrend,
        marketplaceListings: marketplaceTrend,
        notes: postTrend,
      },
    },
  });
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', search, role } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: { posts: true, followers: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count({ where });

  res.json({
    success: true,
    data: {
      users,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['STUDENT', 'MODERATOR', 'ADMIN'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true },
  });

  res.json({
    success: true,
    message: 'User role updated',
    data: user,
  });
};

// ==================== REPORTS ====================

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: {
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

  const total = await prisma.report.count({ where });

  res.json({
    success: true,
    data: {
      reports,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const resolveReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['RESOLVED', 'DISMISSED'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const report = await prisma.report.update({
    where: { id },
    data: {
      status,
      resolvedBy: req.user!.id,
      resolvedAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Report resolved',
    data: report,
  });
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason, description, contentType, contentId, reportedUserId } = req.body;

  const report = await prisma.report.create({
    data: {
      reason,
      description,
      contentType,
      contentId,
      reporterId: req.user!.id,
      reportedUserId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted',
    data: report,
  });
};

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { range = '30d' } = req.query;
  const months = range === '7d' ? 1 : range === '90d' ? 9 : 3;

  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - months);

  const userGrowth: { month: string; users: number }[] = [];
  const now = new Date();
  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = await prisma.user.count({
      where: { createdAt: { gte: start, lte: end } },
    });
    userGrowth.push({
      month: start.toLocaleString('default', { month: 'short' }),
      users: count,
    });
  }

  const [posts, notes, groups, marketplace, events, jobs] = await Promise.all([
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.note.count(),
    prisma.studyGroup.count(),
    prisma.marketplaceItem.count(),
    prisma.event.count(),
    prisma.job.count().catch(() => 0),
  ]);

  const contentDistribution = [
    { name: 'Posts', value: posts },
    { name: 'Notes', value: notes },
    { name: 'Groups', value: groups },
    { name: 'Marketplace', value: marketplace },
    { name: 'Events', value: events },
    { name: 'Jobs', value: jobs },
  ].filter((item) => item.value > 0);

  res.json({
    success: true,
    data: {
      userGrowth,
      contentDistribution,
    },
  });
};

export const getUniversities = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { location: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const universities = await prisma.university.findMany({
    where,
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: { universities } });
};

export const createUniversity = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, location } = req.body;
  if (!name || !location) throw new AppError('Name and location are required', 400);

  const university = await prisma.university.create({
    data: { name, location },
  });

  res.status(201).json({ success: true, data: university });
};

export const updateUniversity = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, location } = req.body;

  const university = await prisma.university.update({
    where: { id },
    data: { ...(name && { name }), ...(location && { location }) },
  });

  res.json({ success: true, data: university });
};

export const toggleUniversityVerified = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isVerified } = req.body;

  const university = await prisma.university.update({
    where: { id },
    data: { isVerified },
  });

  res.json({ success: true, data: university });
};

export const deleteUniversity = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.university.delete({ where: { id } });
  res.json({ success: true, message: 'University deleted' });
};

// ==================== SECURITY ====================

export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const sessions = await prisma.activeSession.findMany({
    include: { user: { select: { id: true, fullName: true, username: true, profilePicture: true } } },
    orderBy: { lastActive: 'desc' },
  });
  res.json({ success: true, data: { sessions } });
};

export const forceLogoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.activeSession.delete({ where: { id } });
  res.json({ success: true, message: 'Session terminated' });
};

export const getSecurityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const logs = await prisma.securityLog.findMany({
    take: 100,
    include: { user: { select: { id: true, fullName: true, username: true, profilePicture: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { logs } });
};

// ==================== AUDIT ====================

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { adminId, action } = req.query;
  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    include: { admin: { select: { id: true, fullName: true, username: true, profilePicture: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: { logs } });
};

// ==================== ANNOUNCEMENTS ====================

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  const announcements = await prisma.announcement.findMany({
    include: { createdBy: { select: { id: true, fullName: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { announcements } });
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, message, type, targeting } = req.body;
  if (!title || !message) throw new AppError('Title and message are required', 400);

  const announcement = await prisma.announcement.create({
    data: { title, message, type: type || 'ALL', targeting, createdById: req.user!.id },
    include: { createdBy: { select: { id: true, fullName: true, username: true } } },
  });
  res.status(201).json({ success: true, data: announcement });
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.announcement.delete({ where: { id } });
  res.json({ success: true, message: 'Announcement deleted' });
};

// ==================== SETTINGS ====================

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      general: { siteName: 'UniHub', siteDescription: 'Campus social network', maintenanceMode: false },
      email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpFrom: '', emailEnabled: false },
      security: { passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireNumber: true, passwordRequireSpecial: false, sessionTimeoutMinutes: 60, maxLoginAttempts: 5, lockoutDurationMinutes: 15 },
      notifications: { emailNotifications: true, pushNotifications: true, mentionNotifications: true, messageNotifications: true, eventReminders: true, announcementNotifications: true },
    },
  });
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { section, data } = req.body;
  res.json({ success: true, message: `Settings for ${section} saved` });
};

// ==================== USER MANAGEMENT ====================

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { isSuspended: true },
    select: { id: true, username: true, isSuspended: true },
  });

  await prisma.adminAction.create({
    data: { action: 'SUSPEND', targetType: 'USER', targetId: id, reason, adminId: req.user!.id },
  });

  res.json({ success: true, data: user });
};

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: { isSuspended: false, isBanned: false },
    select: { id: true, username: true, isSuspended: true, isBanned: true },
  });
  res.json({ success: true, data: user });
};

export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { isBanned: true },
    select: { id: true, username: true, isBanned: true },
  });

  await prisma.adminAction.create({
    data: { action: 'BAN', targetType: 'USER', targetId: id, reason, adminId: req.user!.id },
  });

  res.json({ success: true, data: user });
};

export const unbanUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: { isBanned: false },
    select: { id: true, username: true, isBanned: true },
  });
  res.json({ success: true, data: user });
};

// ==================== CONTENT MANAGEMENT ====================

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', isApproved } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (isApproved !== undefined) where.isApproved = isApproved === 'true';

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, username: true, fullName: true, profilePicture: true } } },
    }),
    prisma.note.count({ where }),
  ]);
  res.json({ success: true, data: { notes, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
};

export const approveNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const note = await prisma.note.update({ where: { id }, data: { isApproved: { not: undefined } as any } });
  res.json({ success: true, data: note });
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.note.delete({ where: { id } });
  res.json({ success: true, message: 'Note deleted' });
};

export const getMarketplaceItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', category, isApproved } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (category) where.category = category;
  if (isApproved !== undefined) where.isApproved = isApproved === 'true';

  const [items, total] = await Promise.all([
    prisma.marketplaceItem.findMany({
      where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
      include: { seller: { select: { id: true, username: true, fullName: true, profilePicture: true } } },
    }),
    prisma.marketplaceItem.count({ where }),
  ]);
  res.json({ success: true, data: { items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
};

export const approveMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const item = await prisma.marketplaceItem.findUnique({ where: { id }, select: { isApproved: true } });
  const updated = await prisma.marketplaceItem.update({ where: { id }, data: { isApproved: !item?.isApproved } });
  res.json({ success: true, data: updated });
};

export const deleteMarketplaceItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.marketplaceItem.delete({ where: { id } });
  res.json({ success: true, message: 'Listing deleted' });
};

export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  const groups = await prisma.studyGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true } } },
  });
  res.json({ success: true, data: { groups } });
};

export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.studyGroup.delete({ where: { id } });
  res.json({ success: true, message: 'Group deleted' });
};

export const getHostels = async (req: AuthRequest, res: Response): Promise<void> => {
  const hostels = await prisma.hostel.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { hostels } });
};

export const approveHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findUnique({ where: { id }, select: { isApproved: true } });
  const updated = await prisma.hostel.update({ where: { id }, data: { isApproved: !hostel?.isApproved } });
  res.json({ success: true, data: updated });
};

export const deleteHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.hostel.delete({ where: { id } });
  res.json({ success: true, message: 'Hostel deleted' });
};

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { jobs } });
};

export const approveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const job = await prisma.job.findUnique({ where: { id }, select: { isApproved: true } });
  const updated = await prisma.job.update({ where: { id }, data: { isApproved: !job?.isApproved } });
  res.json({ success: true, data: updated });
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.job.delete({ where: { id } });
  res.json({ success: true, message: 'Job deleted' });
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { events } });
};

export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id }, select: { isApproved: true } });
  const updated = await prisma.event.update({ where: { id }, data: { isApproved: !event?.isApproved } });
  res.json({ success: true, data: updated });
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.event.delete({ where: { id } });
  res.json({ success: true, message: 'Event deleted' });
};

// ==================== REPORTS (additional) ====================

export const dismissReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const report = await prisma.report.update({
    where: { id },
    data: { status: 'DISMISSED', resolvedBy: req.user!.id, resolvedAt: new Date() },
  });
  res.json({ success: true, message: 'Report dismissed', data: report });
};
