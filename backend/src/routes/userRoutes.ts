import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  uploadCoverPhoto,
  followUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
  updateFcmToken,
  getOnlineStatus,
} from '../controllers/userController';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.get('/suggested', authenticate, getSuggestedUsers);
router.post('/online-status', authenticate, getOnlineStatus);
router.post('/fcm-token', authenticate, updateFcmToken);
router.get('/:username', authenticate, getUserProfile);
router.put('/profile/update', authenticate, updateProfile);
router.post('/profile/picture', authenticate, upload.single('image'), uploadProfilePicture);
router.post('/profile/cover', authenticate, upload.single('image'), uploadCoverPhoto);
router.post('/:userId/follow', authenticate, followUser);
router.get('/:username/followers', authenticate, getFollowers);
router.get('/:username/following', authenticate, getFollowing);

export default router;
