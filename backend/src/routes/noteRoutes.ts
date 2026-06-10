import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  uploadNote,
  getNotes,
  getNote,
  downloadNote,
  bookmarkNote,
  rateNote,
} from '../controllers/noteController';

const router = Router();

router.get('/', authenticate, getNotes);
router.post('/', authenticate, upload.single('file'), uploadNote);
router.get('/:id', authenticate, getNote);
router.post('/:id/download', authenticate, downloadNote);
router.post('/:id/bookmark', authenticate, bookmarkNote);
router.post('/:id/rate', authenticate, rateNote);

export default router;
