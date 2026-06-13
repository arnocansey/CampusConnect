import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Get published announcements (for all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        createdBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: { announcements } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

export default router;
