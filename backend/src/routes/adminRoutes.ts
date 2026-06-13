import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  getDashboardStats,
  getAnalytics,
  getUsers,
  updateUserRole,
  suspendUser,
  reactivateUser,
  banUser,
  unbanUser,
  getReports,
  resolveReport,
  dismissReport,
  createReport,
  getUniversities,
  createUniversity,
  updateUniversity,
  toggleUniversityVerified,
  deleteUniversity,
  getSessions,
  forceLogoutSession,
  getSecurityLogs,
  getAuditLogs,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getSettings,
  updateSettings,
  uploadSiteLogo,
  getNotes,
  approveNote,
  deleteNote,
  getMarketplaceItems,
  approveMarketplaceItem,
  deleteMarketplaceItem,
  getGroups,
  deleteGroup,
  getHostels,
  approveHostel,
  deleteHostel,
  getJobs,
  approveJob,
  deleteJob,
  getEvents,
  approveEvent,
  deleteEvent,
} from '../controllers/adminController';

const router = Router();

// Dashboard & Analytics
router.get('/dashboard', authenticate, authorize('ADMIN'), getDashboardStats);
router.get('/analytics', authenticate, authorize('ADMIN'), getAnalytics);

// Universities
router.get('/universities', authenticate, authorize('ADMIN'), getUniversities);
router.post('/universities', authenticate, authorize('ADMIN'), createUniversity);
router.patch('/universities/:id', authenticate, authorize('ADMIN'), updateUniversity);
router.patch('/universities/:id/verify', authenticate, authorize('ADMIN'), toggleUniversityVerified);
router.delete('/universities/:id', authenticate, authorize('ADMIN'), deleteUniversity);

// Users
router.get('/users', authenticate, authorize('ADMIN'), getUsers);
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);
router.patch('/users/:id/suspend', authenticate, authorize('ADMIN'), suspendUser);
router.patch('/users/:id/reactivate', authenticate, authorize('ADMIN'), reactivateUser);
router.patch('/users/:id/ban', authenticate, authorize('ADMIN'), banUser);
router.patch('/users/:id/unban', authenticate, authorize('ADMIN'), unbanUser);

// Reports
router.get('/reports', authenticate, authorize('ADMIN', 'MODERATOR'), getReports);
router.put('/reports/:id/resolve', authenticate, authorize('ADMIN', 'MODERATOR'), resolveReport);
router.put('/reports/:id/dismiss', authenticate, authorize('ADMIN', 'MODERATOR'), dismissReport);
router.post('/reports', authenticate, createReport);

// Notes
router.get('/notes', authenticate, authorize('ADMIN'), getNotes);
router.patch('/notes/:id/approve', authenticate, authorize('ADMIN'), approveNote);
router.delete('/notes/:id', authenticate, authorize('ADMIN'), deleteNote);

// Marketplace
router.get('/marketplace', authenticate, authorize('ADMIN'), getMarketplaceItems);
router.patch('/marketplace/:id/approve', authenticate, authorize('ADMIN'), approveMarketplaceItem);
router.delete('/marketplace/:id', authenticate, authorize('ADMIN'), deleteMarketplaceItem);

// Groups
router.get('/groups', authenticate, authorize('ADMIN'), getGroups);
router.delete('/groups/:id', authenticate, authorize('ADMIN'), deleteGroup);

// Hostels
router.get('/hostels', authenticate, authorize('ADMIN'), getHostels);
router.patch('/hostels/:id/approve', authenticate, authorize('ADMIN'), approveHostel);
router.delete('/hostels/:id', authenticate, authorize('ADMIN'), deleteHostel);

// Jobs
router.get('/jobs', authenticate, authorize('ADMIN'), getJobs);
router.patch('/jobs/:id/approve', authenticate, authorize('ADMIN'), approveJob);
router.delete('/jobs/:id', authenticate, authorize('ADMIN'), deleteJob);

// Events
router.get('/events', authenticate, authorize('ADMIN'), getEvents);
router.patch('/events/:id/approve', authenticate, authorize('ADMIN'), approveEvent);
router.delete('/events/:id', authenticate, authorize('ADMIN'), deleteEvent);

// Security
router.get('/security/sessions', authenticate, authorize('ADMIN'), getSessions);
router.delete('/security/sessions/:id', authenticate, authorize('ADMIN'), forceLogoutSession);
router.get('/security/logs', authenticate, authorize('ADMIN'), getSecurityLogs);

// Audit
router.get('/audit', authenticate, authorize('ADMIN'), getAuditLogs);

// Announcements
router.get('/announcements', authenticate, authorize('ADMIN'), getAnnouncements);
router.post('/announcements', authenticate, authorize('ADMIN'), createAnnouncement);
router.delete('/announcements/:id', authenticate, authorize('ADMIN'), deleteAnnouncement);

// Settings
router.get('/settings', authenticate, authorize('ADMIN'), getSettings);
router.put('/settings', authenticate, authorize('ADMIN'), updateSettings);
router.post('/settings/logo', authenticate, authorize('ADMIN'), upload.single('logo'), uploadSiteLogo);

export default router;
