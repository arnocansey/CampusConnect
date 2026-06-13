import { Router } from 'express';
import { chat, clearHistory, getSuggestions } from '../controllers/aiChatController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/chat', chat);
router.delete('/history', clearHistory);
router.get('/suggestions', getSuggestions);

export default router;
