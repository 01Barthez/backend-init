import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

describe('OAuth API', () => {
  it('GET /api/v1/auth/oauth/accounts returns 401 without authentication', async () => {
    const response = await request(app).get('/api/v1/auth/oauth/accounts');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /api/v1/auth/oauth/google/unlink returns 401 without authentication', async () => {
    const response = await request(app).delete('/api/v1/auth/oauth/google/unlink');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/auth/oauth/google is public (redirect or provider error, not 401)', async () => {
    const response = await request(app).get('/api/v1/auth/oauth/google');

    // Provider may redirect (302) or fail if credentials are missing (400/500).
    // It must not require a bearer token.
    expect(response.status).not.toBe(401);
    expect([302, 400, 500]).toContain(response.status);
  });

  it('POST /api/v1/auth/oauth/telegram returns 400 without body', async () => {
    const response = await request(app).post('/api/v1/auth/oauth/telegram').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
