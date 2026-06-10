import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, company, description, requirements, salary, jobType, location, isRemote, deadline, applicationUrl, contactEmail } = req.body;

  const job = await prisma.job.create({
    data: {
      title,
      company,
      description,
      requirements,
      salary,
      jobType,
      location,
      isRemote,
      deadline: deadline ? new Date(deadline) : undefined,
      applicationUrl,
      contactEmail,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    data: job,
  });
};

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', jobType, search } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};

  if (jobType) where.jobType = jobType;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { company: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      _count: {
        select: { applications: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.job.count({ where });

  res.json({
    success: true,
    data: {
      jobs,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  let hasApplied = false;
  if (req.user) {
    const application = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId: id,
          userId: req.user.id,
        },
      },
    });
    hasApplied = !!application;
  }

  res.json({
    success: true,
    data: { ...job, hasApplied },
  });
};

export const applyForJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { coverLetter } = req.body;

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, deadline: true },
  });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (job.deadline && new Date(job.deadline) < new Date()) {
    throw new AppError('Application deadline has passed', 400);
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_userId: {
        jobId: id,
        userId: req.user!.id,
      },
    },
  });

  if (existingApplication) {
    throw new AppError('Already applied for this job', 409);
  }

  let resumeUrl = undefined;
  if (req.file) {
    const { uploadImage } = require('../utils/cloudinary');
    resumeUrl = await uploadImage(req.file, 'campusconnect/resumes');
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId: id,
      userId: req.user!.id,
      coverLetter,
      resumeUrl,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: application,
  });
};
