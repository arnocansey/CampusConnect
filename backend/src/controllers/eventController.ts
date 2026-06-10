import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, venue, date, endTime, category, maxAttendees } = req.body;

  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = await uploadImage(req.file, 'campusconnect/events');
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      imageUrl,
      venue,
      date: new Date(date),
      endTime: endTime ? new Date(endTime) : undefined,
      category,
      maxAttendees: maxAttendees ? parseInt(maxAttendees as string) : null,
      organizerId: req.user!.id,
    },
    include: {
      organizer: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', category, upcoming } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};

  if (category) where.category = category;
  if (upcoming === 'true') {
    where.date = { gte: new Date() };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { date: 'asc' },
  });

  const total = await prisma.event.count({ where });

  res.json({
    success: true,
    data: {
      events,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  let registration = null;
  if (req.user) {
    registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: req.user.id,
        },
      },
    });
  }

  res.json({
    success: true,
    data: {
      ...event,
      isRegistered: !!registration,
      ticketCode: registration?.ticketCode,
      checkedIn: registration?.checkedIn,
    },
  });
};

export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, maxAttendees: true, _count: { select: { registrations: true } } },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
    throw new AppError('Event is full', 400);
  }

  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId: id,
        userId: req.user!.id,
      },
    },
  });

  if (existingRegistration) {
    throw new AppError('Already registered for this event', 409);
  }

  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: id,
      userId: req.user!.id,
      ticketCode: uuidv4(),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Registered for event successfully',
    data: {
      ticketCode: registration.ticketCode,
    },
  });
};

export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const registration = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId: id,
        userId: req.user!.id,
      },
    },
  });

  if (!registration) {
    throw new AppError('Not registered for this event', 400);
  }

  await prisma.eventRegistration.delete({ where: { id: registration.id } });

  res.json({
    success: true,
    message: 'Registration cancelled',
  });
};
