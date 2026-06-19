import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { upload } from '../utils/cloudinary';
import {
  featureMarketplaceItem,
  unfeatureMarketplaceItem,
  getFeaturedItems,
  createBannerAd,
  getActiveBannerAds,
  trackBannerClick,
  getAllBannerAds,
  updateBannerAd,
  deleteBannerAd,
  becomePremiumSeller,
  getPremiumStatus,
  getAllPremiumSellers,
  revokePremiumSeller,
  purchaseNote,
  checkNotePurchased,
  getNoteEarnings,
  purchaseEventTicket,
  getEventTicketSales,
  checkEventTicket,
  bookHostel,
  getMyBookings,
  getHostelBookings,
  getPlatformRevenue,
} from '../controllers/revenueController';

const router = Router();

// Featured Listings
router.post('/marketplace/:id/feature', authenticate, featureMarketplaceItem);
router.delete('/marketplace/:id/feature', authenticate, unfeatureMarketplaceItem);
router.get('/marketplace/featured', getFeaturedItems);

// Banner Ads
router.get('/banners', getActiveBannerAds);
router.post('/banners/:id/click', trackBannerClick);
router.get('/admin/banners', authenticate, authorize('ADMIN'), getAllBannerAds);
router.post('/admin/banners', authenticate, authorize('ADMIN'), upload.single('image'), createBannerAd);
router.put('/admin/banners/:id', authenticate, authorize('ADMIN'), upload.single('image'), updateBannerAd);
router.delete('/admin/banners/:id', authenticate, authorize('ADMIN'), deleteBannerAd);

// Premium Profiles
router.post('/premium/become', authenticate, becomePremiumSeller);
router.get('/premium/status', authenticate, getPremiumStatus);
router.get('/admin/premium-sellers', authenticate, authorize('ADMIN'), getAllPremiumSellers);
router.delete('/admin/premium-sellers/:id/revoke', authenticate, authorize('ADMIN'), revokePremiumSeller);

// Notes Marketplace
router.post('/notes/:id/purchase', authenticate, purchaseNote);
router.get('/notes/:id/purchased', authenticate, checkNotePurchased);
router.get('/notes/earnings', authenticate, getNoteEarnings);

// Event Ticketing
router.post('/events/:id/ticket', authenticate, purchaseEventTicket);
router.get('/events/:id/ticket/check', authenticate, checkEventTicket);
router.get('/events/tickets/sales', authenticate, getEventTicketSales);

// Hostel Bookings
router.post('/hostels/:id/book', authenticate, bookHostel);
router.get('/hostels/bookings', authenticate, getMyBookings);
router.get('/hostels/:id/bookings', authenticate, getHostelBookings);

// Revenue Dashboard (Admin)
router.get('/admin/revenue', authenticate, authorize('ADMIN'), getPlatformRevenue);

export default router;
