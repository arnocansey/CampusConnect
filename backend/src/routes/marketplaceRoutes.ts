import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  createMarketplaceItem,
  getMarketplaceItems,
  getMarketplaceItem,
  updateMarketplaceItem,
  deleteMarketplaceItem,
  reviewMarketplaceItem,
  getUserMarketplaceItems,
  getSellerStorefront,
  getSellerStats,
} from '../controllers/marketplaceController';

const router = Router();

router.get('/', authenticate, getMarketplaceItems);
router.get('/my-shop', authenticate, getSellerStats);
router.get('/seller/:username', authenticate, getSellerStorefront);
router.get('/user/:username', authenticate, getUserMarketplaceItems);
router.post('/', authenticate, upload.array('images', 10), createMarketplaceItem);
router.get('/:id', authenticate, getMarketplaceItem);
router.put('/:id', authenticate, updateMarketplaceItem);
router.delete('/:id', authenticate, deleteMarketplaceItem);
router.post('/:id/reviews', authenticate, reviewMarketplaceItem);

export default router;
