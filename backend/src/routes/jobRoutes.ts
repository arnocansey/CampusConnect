import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createJob,
  getJobs,
  getJob,
  applyForJob,
} from '../controllers/jobController';

const router = Router();

router.get('/', authenticate, getJobs);
router.post('/', authenticate, createJob);
router.get('/:id', authenticate, getJob);
router.post('/:id/apply', authenticate, upload.single('resume'), applyForJob);

export default router;
