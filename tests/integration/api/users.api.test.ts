import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

const AUTH_REQUIRED_ROUTES: Array<{
  method: 'get' | 'put' | 'post' | 'patch' | 'delete';
  path: string;
}> = [
  { method: 'put', path: '/api/v1/users/profile' },
  { method: 'delete', path: '/api/v1/users/profile/avatar' },
  { method: 'delete', path: '/api/v1/users/me' },
  { method: 'post', path: '/api/v1/users/invite' },
  { method: 'get', path: '/api/v1/users/' },
  { method: 'get', path: '/api/v1/users/search?search=test' },
  { method: 'get', path: '/api/v1/users/export' },
  { method: 'get', path: '/api/v1/users/507f1f77bcf86cd799439011' },
  { method: 'patch', path: '/api/v1/users/507f1f77bcf86cd799439011' },
  { method: 'put', path: '/api/v1/users/507f1f77bcf86cd799439011/role' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/activate' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/deactivate' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/verify-email' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/unlock' },
  { method: 'post', path: '/api/v1/users/507f1f77bcf86cd799439011/revoke-sessions' },
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
