import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  studentId: z.string().min(1).optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  department: z.string().optional(),
  program: z.string().optional(),
  level: z.number().int().min(100).max(500).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

export const createPostSchema = z.object({
  content: z.string().max(5000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'POLL']).optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => data.content || data.type !== 'TEXT',
  { message: 'Content is required for text posts' }
);

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const createMarketplaceItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.enum([
    'BOOKS', 'ELECTRONICS', 'CLOTHING', 'ACCESSORIES',
    'SERVICES', 'HOSTEL_ITEMS', 'OTHER'
  ]),
  condition: z.enum(['NEW', 'LIKE_NEW', 'USED', 'FAIR']).optional(),
  location: z.string().optional(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  course: z.string().min(1),
  department: z.string().min(1),
  level: z.number().int().min(100).max(500),
  semester: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createStudyGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  course: z.string().optional(),
  department: z.string().optional(),
  level: z.number().int().min(100).max(500).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(1000).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  requirements: z.array(z.string()),
  salary: z.string().optional(),
  jobType: z.enum(['PART_TIME', 'FULL_TIME', 'INTERNSHIP', 'FREELANCE', 'VOLUNTEER']),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  deadline: z.string().datetime().optional(),
  applicationUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  venue: z.string().min(1),
  date: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  category: z.enum(['ACADEMIC', 'SOCIAL', 'SPORTS', 'CULTURAL', 'TECH', 'CAREER', 'OTHER']).optional(),
  maxAttendees: z.number().int().positive().optional(),
});

export const createHostelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pricePerMonth: z.number().positive(),
  currency: z.string().default('USD'),
  roomType: z.enum(['SINGLE', 'SHARED', 'SELF_CONTAINED']),
  facilities: z.array(z.string()),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  conversationId: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
