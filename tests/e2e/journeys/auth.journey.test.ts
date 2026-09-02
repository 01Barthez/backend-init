import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

import { expectErrorEnvelope } from '../../helpers/assertions';

/**
 * E2E journeys exercise the full HTTP pipeline with offline infra doubles.
 * They assert cross-route behavior, not isolated validation rules.
 */
describe('Auth journey (offline)', () => {
  it('rejects unauthenticated password change then accepts health probe', async () => {
    const denied = await request(app)
      .post('/api/v1/auth/change-password')
      .send({ current_password: 'OldPass1!', new_password: 'NewPass1!' });

    expect(denied.status).toBe(401);
    expectErrorEnvelope(denied.body);

    const health = await request(app).get('/health').expect(200);
    expect(health.body).toBeDefined();
  });

  it('signup validation failure does not create a session cookie', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({ email: 'bad' });

    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
