import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { uploadImage } from '../utils/cloudinary';

export const uploadNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, course, department, level, semester, tags } = req.body;

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  let parsedTitle = title;
  let parsedDescription = description;
  let parsedTags = tags;

  if (req.file.mimetype === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(req.file.buffer);
      const text = parsed.text || '';

      // Auto-extract title if missing
      if (!parsedTitle || !parsedTitle.trim()) {
        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 3);
        if (lines.length > 0) {
          parsedTitle = lines[0].substring(0, 60);
        } else {
          parsedTitle = req.file.originalname.replace(/\.[^/.]+$/, "");
        }
      }

      // Auto-extract tags if missing
      let autoTags: string[] = [];
      const hasNoTags = !parsedTags ||
        (Array.isArray(parsedTags) && parsedTags.length === 0) ||
        (typeof parsedTags === 'string' && parsedTags.trim() === '') ||
        parsedTags === '[]';

      if (hasNoTags) {
        const stopWords = new Set([
          'the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'on', 'for', 'this', 'with', 'as', 'are', 'was', 'by', 'an', 'be', 'at', 'or', 'from',
          'about', 'above', 'after', 'again', 'against', 'along', 'already', 'although', 'among', 'around', 'because', 'before', 'behind', 'below',
          'beneath', 'beside', 'between', 'beyond', 'during', 'except', 'following', 'inside', 'instead', 'into', 'like', 'near', 'opposite', 'outside',
          'over', 'round', 'since', 'through', 'throughout', 'till', 'toward', 'towards', 'under', 'underneath', 'until', 'upon', 'with', 'within',
          'without', 'would', 'could', 'should', 'their', 'there', 'these', 'those', 'other', 'another', 'course', 'lecture', 'notes', 'study',
          'exam', 'prepare', 'grade', 'university', 'school', 'student', 'class', 'chapter', 'section', 'page'
        ]);

        const words = text
          .toLowerCase()
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 4 && !stopWords.has(w));

        const freqs: Record<string, number> = {};
        for (const w of words) {
          freqs[w] = (freqs[w] || 0) + 1;
        }

        autoTags = Object.keys(freqs)
          .sort((a, b) => freqs[b] - freqs[a])
          .slice(0, 5);

        parsedTags = autoTags;
      }

      // Auto-extract description if missing
      if (!parsedDescription || !parsedDescription.trim()) {
        const topics = autoTags.length > 0 ? ` Topics include: ${autoTags.join(', ')}.` : '';
        parsedDescription = `Automatically parsed PDF note. Total pages: ${parsed.numpages || 1}.${topics}`;
      }
    } catch (pdfErr) {
      console.error('Failed to parse PDF:', pdfErr);
      if (!parsedTitle) {
        parsedTitle = req.file.originalname.replace(/\.[^/.]+$/, "");
      }
      if (!parsedDescription) {
        parsedDescription = 'Uploaded note document.';
      }
      if (!parsedTags) {
        parsedTags = [];
      }
    }
  } else {
    if (!parsedTitle) {
      parsedTitle = req.file.originalname.replace(/\.[^/.]+$/, "");
    }
    if (!parsedDescription) {
      parsedDescription = 'Uploaded note document.';
    }
    if (!parsedTags) {
      parsedTags = [];
    }
  }

  // Parse tags if it is a JSON string from client
  let finalTags: string[] = [];
  if (typeof parsedTags === 'string') {
    try {
      finalTags = JSON.parse(parsedTags);
    } catch (e) {
      finalTags = parsedTags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
  } else if (Array.isArray(parsedTags)) {
    finalTags = parsedTags;
  }

  const fileUrl = await uploadImage(req.file, 'campusconnect/notes');

  const fileTypeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOCX',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  };

  const note = await prisma.note.create({
    data: {
      title: parsedTitle,
      description: parsedDescription,
      fileUrl,
      fileType: (fileTypeMap[req.file.mimetype] || 'OTHER') as any,
      course,
      department,
      level: typeof level === 'string' ? parseInt(level) : level,
      semester,
      tags: finalTags,
      uploaderId: req.user!.id,
    },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: {
          downloads: true,
          ratings: true,
          comments: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Note uploaded successfully',
    data: note,
  });
};

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', course, department, level, search, uploaderId } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};

  if (uploaderId) {
    where.uploaderId = uploaderId as string;
  }

  if (course) where.course = course;
  if (department) where.department = department;
  if (level) where.level = parseInt(level as string);

  if (search) {
    const terms = (search as string).split(/\s+/).filter(Boolean);
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      ...terms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' } },
        { course: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ]),
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
        },
      },
      _count: {
        select: {
          downloads: true,
          ratings: true,
          comments: true,
        },
      },
      ratings: req.user
        ? {
            where: { userId: req.user.id },
            select: { rating: true },
          }
        : false,
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.note.count({ where });

  res.json({
    success: true,
    data: {
      notes: notes.map((n) => ({
        ...n,
        userRating: n.ratings?.[0]?.rating,
        ratings: undefined,
      })),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          downloads: true,
          ratings: true,
          comments: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  const avgRating = await prisma.noteRating.aggregate({
    where: { noteId: id },
    _avg: { rating: true },
  });

  let isBookmarked = false;
  if (req.user) {
    const bookmark = await prisma.noteBookmark.findUnique({
      where: {
        noteId_userId: {
          noteId: id,
          userId: req.user.id,
        },
      },
    });
    isBookmarked = !!bookmark;
  }

  res.json({
    success: true,
    data: {
      ...note,
      averageRating: avgRating._avg.rating || 0,
      isBookmarked,
    },
  });
};

export const downloadNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const note = await prisma.note.findUnique({
    where: { id },
    select: { id: true, fileUrl: true },
  });

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  await prisma.noteDownload.create({
    data: {
      noteId: id,
      userId: req.user!.id,
    },
  });

  res.json({
    success: true,
    data: { fileUrl: note.fileUrl },
  });
};

export const bookmarkNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existingBookmark = await prisma.noteBookmark.findUnique({
    where: {
      noteId_userId: {
        noteId: id,
        userId: req.user!.id,
      },
    },
  });

  if (existingBookmark) {
    await prisma.noteBookmark.delete({ where: { id: existingBookmark.id } });

    res.json({
      success: true,
      message: 'Bookmark removed',
      data: { isBookmarked: false },
    });
  } else {
    await prisma.noteBookmark.create({
      data: {
        noteId: id,
        userId: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Note bookmarked',
      data: { isBookmarked: true },
    });
  }
};

export const rateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating } = req.body;

  const existingRating = await prisma.noteRating.findUnique({
    where: {
      noteId_userId: {
        noteId: id,
        userId: req.user!.id,
      },
    },
  });

  if (existingRating) {
    await prisma.noteRating.update({
      where: { id: existingRating.id },
      data: { rating },
    });
  } else {
    await prisma.noteRating.create({
      data: {
        noteId: id,
        userId: req.user!.id,
        rating,
      },
    });
  }

  const avgRating = await prisma.noteRating.aggregate({
    where: { noteId: id },
    _avg: { rating: true },
  });

  res.json({
    success: true,
    message: 'Rating submitted',
    data: { averageRating: avgRating._avg.rating || 0 },
  });
};
