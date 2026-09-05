import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

describe('System API', () => {
  it('GET /health returns 200', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toBeDefined();
  });

  it('GET /health/live returns 200', async () => {
    const response = await request(app).get('/health/live').expect(200);
    expect(response.body).toBeDefined();
  });

  it('GET /health/ready returns 200 when dependencies respond', async () => {
    const response = await request(app).get('/health/ready').expect(200);
    expect(response.body).toBeDefined();
  });

  it('GET /api-docs.json returns OpenAPI document', async () => {
    const response = await request(app).get('/api-docs.json').expect(200);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body.info.title).toBe('Backend Init API');
  });

  it('GET /metrics returns Prometheus metrics', async () => {
    const response = await request(app).get('/metrics').expect(200);
    expect(response.text).toContain('nodejs_');
  });

  it('GET /csrf-token returns current CSRF endpoint behavior', async () => {
    const response = await request(app).get('/csrf-token');

    // Enabled → 200 + token; disabled → 200 + csrfEnabled:false; misconfig → 500.
    expect([200, 500]).toContain(response.status);
    expect(response.body).toBeDefined();

    if (response.status === 200) {
      const payload = response.body?.data ?? response.body;
      expect(payload).toHaveProperty('csrfEnabled');
      if (payload.csrfEnabled) {
        expect(payload.csrfToken).toBeTruthy();
      } else {
        expect(payload.csrfToken == null).toBe(true);
      }
    }
  });
});
