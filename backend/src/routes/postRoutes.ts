import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createPost,
  getFeed,
  getPost,
  deletePost,
  likePost,
  savePost,
  votePoll,
  getSavedPosts,
  getTrendingTopics,
} from '../controllers/postController';
import {
  createComment,
  getComments,
  deleteComment,
} from '../controllers/commentController';

const router = Router();

router.get('/feed', authenticate, getFeed);
router.get('/trending', authenticate, getTrendingTopics);
router.get('/saved', authenticate, getSavedPosts);
router.post('/', authenticate, upload.array('images', 10), createPost);
router.get('/:id', authenticate, getPost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/save', authenticate, savePost);
router.post('/:id/vote', authenticate, votePoll);
router.post('/:postId/comments', authenticate, createComment);
router.get('/:postId/comments', authenticate, getComments);
router.delete('/comments/:id', authenticate, deleteComment);

export default router;
