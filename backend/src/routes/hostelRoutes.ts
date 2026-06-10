import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createHostel,
  getHostels,
  getHostel,
  reviewHostel,
} from '../controllers/hostelController';

const router = Router();

router.get('/', authenticate, getHostels);
router.post('/', authenticate, upload.array('images', 10), createHostel);
router.get('/:id', authenticate, getHostel);
router.post('/:id/reviews', authenticate, reviewHostel);

export default router;
