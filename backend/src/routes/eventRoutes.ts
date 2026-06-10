import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createEvent,
  getEvents,
  getEvent,
  registerForEvent,
  cancelRegistration,
} from '../controllers/eventController';

const router = Router();

router.get('/', authenticate, getEvents);
router.post('/', authenticate, upload.single('image'), createEvent);
router.get('/:id', authenticate, getEvent);
router.post('/:id/register', authenticate, registerForEvent);
router.delete('/:id/register', authenticate, cancelRegistration);

export default router;
