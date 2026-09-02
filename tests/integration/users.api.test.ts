import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

const AUTH_REQUIRED_ROUTES: Array<{
  method: 'get' | 'put' | 'post' | 'delete';
  path: string;
}> = [
  { method: 'put', path: '/api/v1/users/profile' },
  { method: 'get', path: '/api/v1/users/' },
  { method: 'get', path: '/api/v1/users/search?q=test' },
  { method: 'get', path: '/api/v1/users/export' },
  { method: 'delete', path: '/api/v1/users/clear-all' },
  { method: 'get', path: '/api/v1/users/507f1f77bcf86cd799439011' },
  { method: 'put', path: '/api/v1/users/507f1f77bcf86cd799439011/role' },
  { method: 'delete', path: '/api/v1/users/507f1f77bcf86cd799439011' },
  { method: 'delete', path: '/api/v1/users/507f1f77bcf86cd799439011/permanent' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/restore' },
];

describe('Users API', () => {
  it.each(AUTH_REQUIRED_ROUTES)(
    '$method $path returns 401 without authentication',
    async ({ method, path }) => {
      const response = await request(app)[method](path);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    },
  );
});
