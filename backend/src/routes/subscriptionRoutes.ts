import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import {
  getPlans,
  getMySubscription,
  initializePayment,
  verifyPayment,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanActive,
  getAllSubscriptions,
  getRevenueStats,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '../controllers/subscriptionController';

const router = Router();

// Public — anyone can see plans
router.get('/plans', getPlans);

// User
router.get('/my-subscription', authenticate, getMySubscription);
router.post('/initialize', authenticate, initializePayment);
router.get('/verify/:reference', authenticate, verifyPayment);

// Admin
router.get('/admin/plans', authenticate, authorize('ADMIN'), getAllPlans);
router.post('/admin/plans', authenticate, authorize('ADMIN'), createPlan);
router.put('/admin/plans/:id', authenticate, authorize('ADMIN'), updatePlan);
router.delete('/admin/plans/:id', authenticate, authorize('ADMIN'), deletePlan);
router.patch('/admin/plans/:id/toggle', authenticate, authorize('ADMIN'), togglePlanActive);
router.get('/admin/subscriptions', authenticate, authorize('ADMIN'), getAllSubscriptions);
router.get('/admin/subscriptions/:id', authenticate, authorize('ADMIN'), getSubscriptionById);
router.post('/admin/subscriptions', authenticate, authorize('ADMIN'), createSubscription);
router.put('/admin/subscriptions/:id', authenticate, authorize('ADMIN'), updateSubscription);
router.delete('/admin/subscriptions/:id', authenticate, authorize('ADMIN'), deleteSubscription);
router.get('/admin/revenue', authenticate, authorize('ADMIN'), getRevenueStats);

export default router;
