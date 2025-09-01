import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '@/app';
import { createTestUser, clearTestDatabase } from '../../utils/test-database';

describe('Auth API', () => {
  let testUser: { email: string; password: string; token: string };

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        name: 'New User',
        email: 'new@example.com',
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid registration data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Invalid email',
        })
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: testUser.email,
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});
