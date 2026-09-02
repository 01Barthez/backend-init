import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '@/server';

describe('Blog API', () => {
  it('GET /api/v1/blogs returns 200 with paginated structure', async () => {
    const response = await request(app).get('/api/v1/blogs').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('total');
  });

  it('GET /api/v1/blogs/:slug returns 404 for unknown slug', async () => {
    const response = await request(app).get('/api/v1/blogs/non-existent-slug-xyz');

    expect(response.status).toBeGreaterThanOrEqual(404);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/v1/blogs returns 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/blogs')
      .send({ title: 'Test', content: 'Body' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('PUT /api/v1/blogs/:id returns 401 without authentication', async () => {
    const response = await request(app)
      .put('/api/v1/blogs/507f1f77bcf86cd799439011')
      .send({ title: 'Updated', content: 'Body' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('PATCH /api/v1/blogs/:id/publish returns 401 without authentication', async () => {
    const response = await request(app).patch('/api/v1/blogs/507f1f77bcf86cd799439011/publish');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /api/v1/blogs/:id returns 401 without authentication', async () => {
    const response = await request(app).delete('/api/v1/blogs/507f1f77bcf86cd799439011');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
