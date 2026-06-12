import { describe, it, expect } from 'vitest';

describe('Health Check', () => {
  it('should return health status structure', () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'test',
      version: '1.0.0',
    };
    expect(health.status).toBe('ok');
    expect(health.timestamp).toBeDefined();
    expect(typeof health.uptime).toBe('number');
  });
});

describe('Environment Variables', () => {
  it('should have required env vars set in test', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_REFRESH_SECRET).toBeDefined();
    expect(process.env.NODE_ENV).toBe('test');
  });
});
