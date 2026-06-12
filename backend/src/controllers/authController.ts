import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler';

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, username, studentId, email, phoneNumber, password } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
        ...(studentId ? [{ studentId }] : []),
      ],
    },
  });

  if (existingUser) {
    throw new AppError('User with this email, username, or student ID already exists', 409);
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = uuidv4();

  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      ...(studentId ? { studentId } : {}),
      email,
      phoneNumber,
      passwordHash,
      verificationToken,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      role: true,
    },
  });

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  }, true); // Signups persist by default

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please check your email to verify your account.',
    data: { user, ...tokens },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      role: true,
      passwordHash: true,
      isVerified: true,
      profilePicture: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  }, !!rememberMe);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastSeen: new Date(),
    },
  });

  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: userWithoutPassword, ...tokens },
  });
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  const decoded = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, refreshToken: true },
  });

  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokens = generateTokens({
    id: decoded.id,
    email: decoded.email,
    username: decoded.username,
    role: decoded.role,
  }, !!decoded.rememberMe);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  res.json({
    success: true,
    data: tokens,
  });
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
    return;
  }

  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    },
  });

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link.',
  });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  res.json({
    success: true,
    message: 'Password reset successful',
  });
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new AppError('Invalid verification token', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
    },
  });

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      studentId: true,
      phoneNumber: true,
      profilePicture: true,
      coverPhoto: true,
      bio: true,
      department: true,
      program: true,
      level: true,
      skills: true,
      interests: true,
      socialLinks: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: user,
  });
};
