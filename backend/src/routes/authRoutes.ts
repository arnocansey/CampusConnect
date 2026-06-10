import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validation';
import {
  signup,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
} from '../controllers/authController';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', authenticate, getMe);

export default router;
