import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler } from '../src/middleware/errorHandler';
import { logger } from '../src/utils/logger';

vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AppError', () => {
  it('should create an error with statusCode and isOperational', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('should capture stack trace', () => {
    const error = new AppError('Server error', 500);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Error');
  });
});

describe('errorHandler', () => {
  const mockReq = {
    method: 'GET',
    originalUrl: '/api/test',
    ip: '127.0.0.1',
    body: {},
    user: { id: 'user-1' },
  } as any;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle AppError with correct status code', () => {
    const error = new AppError('Not found', 404);
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Not found' }),
    );
  });

  it('should handle generic Error with 500 status', () => {
    const error = new Error('Something went wrong');
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Something went wrong' }),
    );
  });

  it('should log the error', () => {
    const error = new AppError('Test error', 400);
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});

describe('Logger', () => {
  it('should have all log methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});
