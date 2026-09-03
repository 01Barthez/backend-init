import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

describe('Auth API', () => {
  it('POST /api/v1/auth/signup returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/verify returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/verify').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/resend-otp returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/forgot-password returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/forgot-password').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/reset-password returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/v1/auth/reset-password').send({}).expect(400);

    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/refresh returns 401 without cookie', async () => {
    const response = await request(app).post('/api/v1/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/logout returns 401 without token', async () => {
    const response = await request(app).post('/api/v1/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/change-password returns 401 without token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ current_password: 'OldPass1!', new_password: 'NewPass1!' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me returns 401 without token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/auth/sessions returns 401 without token', async () => {
    const response = await request(app).get('/api/v1/auth/sessions');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/auth/totp/enroll returns 401 without token', async () => {
    const response = await request(app).post('/api/v1/auth/totp/enroll');
    expect(response.status).toBe(401);
  });
});
