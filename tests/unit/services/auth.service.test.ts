import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { User } from '@/models/user.model';
import { hashPassword } from '@/utils/crypto';

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserRepository = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockUserRepository as any);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValueOnce(null);
      mockUserRepository.create.mockImplementation(async (data) => ({
        id: '1',
        ...data,
        password: await hashPassword(data.password),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await authService.register(userData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name,
        })
      );
    });

    it('should throw an error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      mockUserRepository.findByEmail.mockResolvedValueOnce({
        id: '1',
        ...userData,
        password: await hashPassword(userData.password),
      });

      await expect(authService.register(userData)).rejects.toThrow(
        'User already exists'
      );
    });
  });
});
