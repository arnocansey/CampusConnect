import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
} from '../controllers/messageController';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, createConversation);
router.get('/conversations/:conversationId', authenticate, getMessages);
router.post('/send', authenticate, upload.single('image'), sendMessage);

export default router;
