import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const PAYSTACK_API = 'https://api.paystack.co';

interface PaystackResponse {
  status: boolean;
  message?: string;
  data?: Record<string, any>;
}

const paystackHeaders = () => ({
  Authorization: `Bearer ${config.paystack.secretKey}`,
  'Content-Type': 'application/json',
});

// ==================== PUBLIC ====================

export const getPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: plans });
};

export const getMySubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId: req.user!.id,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: subscription });
};

export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { planId } = req.body;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    throw new AppError('Plan not found or inactive', 404);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true, fullName: true } });

  const reference = `CC-${uuidv4().slice(0, 8).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      userId: req.user!.id,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      reference,
      status: 'PENDING',
    },
  });

  // Initialize Paystack transaction
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: user!.email,
      amount: Math.round(plan.price * 100), // Paystack uses kobo/pesewas
      reference,
      callback_url: `${config.paystack.baseUrl}/marketplace?payment=success&ref=${reference}`,
      metadata: {
        userId: req.user!.id,
        planId: plan.id,
        paymentId: payment.id,
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: plan.name,
          },
        ],
      },
    }),
  });

  const result = (await response.json()) as PaystackResponse;

  if (!result.status) {
    throw new AppError(result.message || 'Payment initialization failed', 400);
  }

  res.json({
    success: true,
    data: {
      authorization_url: result.data!.authorization_url,
      reference,
      access_code: result.data!.access_code,
    },
  });
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reference } = req.params;

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.status === 'SUCCESS') {
    res.json({ success: true, data: { status: 'already_verified' } });
    return;
  }

  // Verify with Paystack
  const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: paystackHeaders(),
  });

  const result = (await response.json()) as PaystackResponse;

  if (!result.status || result.data?.status !== 'success') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', paystackResponse: result.data as any },
    });
    throw new AppError('Payment verification failed', 400);
  }

  // Payment successful — activate subscription
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: payment.planId! } });
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', paystackResponse: result.data as any },
    }),
    prisma.userSubscription.create({
      data: {
        userId: payment.userId,
        planId: plan.id,
        adsRemaining: plan.adLimit,
        adsUsed: 0,
        startDate: now,
        expiresAt,
        status: 'ACTIVE',
      },
    }),
  ]);

  res.json({ success: true, data: { status: 'verified', expiresAt } });
};

// ==================== GUARD CHECK ====================

export const checkMarketplaceAccess = async (userId: string): Promise<{ canPost: boolean; reason?: string; subscription?: any }> => {
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return { canPost: false, reason: 'no_subscription' };
  }

  // Unlimited ads
  if (subscription.adsRemaining === -1) {
    return { canPost: true, subscription };
  }

  if (subscription.adsRemaining <= 0) {
    return { canPost: false, reason: 'ads_exhausted', subscription };
  }

  return { canPost: true, subscription };
};

// ==================== ADMIN ====================

export const getAllPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { subscriptions: true, payments: true } },
    },
  });
  res.json({ success: true, data: plans });
};

export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, price, adLimit, durationDays, sortOrder } = req.body;

  const plan = await prisma.subscriptionPlan.create({
    data: { name, description, price, adLimit, durationDays, sortOrder: sortOrder || 0 },
  });

  res.status(201).json({ success: true, data: plan });
};

export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, price, adLimit, durationDays, isActive, sortOrder } = req.body;

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(adLimit !== undefined && { adLimit }),
      ...(durationDays !== undefined && { durationDays }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  res.json({ success: true, data: plan });
};

export const deletePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const activeSubs = await prisma.userSubscription.count({
    where: { planId: id, status: 'ACTIVE' },
  });

  if (activeSubs > 0) {
    throw new AppError('Cannot delete plan with active subscriptions. Deactivate it instead.', 400);
  }

  await prisma.subscriptionPlan.delete({ where: { id } });
  res.json({ success: true, message: 'Plan deleted' });
};

export const togglePlanActive = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError('Plan not found', 404);

  const updated = await prisma.subscriptionPlan.update({
    where: { id },
    data: { isActive: !plan.isActive },
  });

  res.json({ success: true, data: updated });
};

export const getAllSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [subscriptions, total] = await Promise.all([
    prisma.userSubscription.findMany({
      include: { user: { select: { id: true, fullName: true, email: true, username: true } }, plan: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.userSubscription.count(),
  ]);

  res.json({
    success: true,
    data: subscriptions,
    total,
    page: parseInt(page as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
};

export const getRevenueStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalRevenue, monthlyRevenue, totalPayments, activeSubscriptions] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.userSubscription.count({ where: { status: 'ACTIVE', expiresAt: { gt: now } } }),
  ]);

  res.json({
    success: true,
    data: {
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      totalPayments,
      activeSubscriptions,
    },
  });
};
