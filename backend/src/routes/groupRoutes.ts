import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  sendGroupMessage,
  getGroupMessages,
} from '../controllers/groupController';

const router = Router();

router.get('/', authenticate, getGroups);
router.post('/', authenticate, createGroup);
router.get('/:id', authenticate, getGroup);
router.post('/:id/join', authenticate, joinGroup);
router.post('/:id/leave', authenticate, leaveGroup);
router.post('/:id/messages', authenticate, sendGroupMessage);
router.get('/:id/messages', authenticate, getGroupMessages);

export default router;
