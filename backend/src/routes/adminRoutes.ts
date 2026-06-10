import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  suspendUser,
  getReports,
  resolveReport,
  createReport,
} from '../controllers/adminController';

const router = Router();

// Admin only routes
router.get('/dashboard', authenticate, authorize('ADMIN'), getDashboardStats);
router.get('/users', authenticate, authorize('ADMIN'), getUsers);
router.put('/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);
router.post('/users/:id/suspend', authenticate, authorize('ADMIN'), suspendUser);
router.get('/reports', authenticate, authorize('ADMIN', 'MODERATOR'), getReports);
router.put('/reports/:id/resolve', authenticate, authorize('ADMIN', 'MODERATOR'), resolveReport);

// Any authenticated user can create a report
router.post('/reports', authenticate, createReport);

export default router;
