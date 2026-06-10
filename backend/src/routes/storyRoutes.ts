import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} from '../controllers/storyController';

const router = Router();

router.get('/', authenticate, getStories);
router.post('/', authenticate, upload.single('image'), createStory);
router.post('/:id/view', authenticate, viewStory);
router.delete('/:id', authenticate, deleteStory);

export default router;
