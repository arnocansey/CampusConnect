import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
