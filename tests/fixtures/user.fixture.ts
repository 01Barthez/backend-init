import type { User } from '@prisma/client';

type UserFactoryInput = Partial<
  Pick<User, 'email' | 'firstName' | 'lastName' | 'phone' | 'password' | 'role'>
>;

export const buildUserFixture = (overrides: UserFactoryInput = {}) => ({
  email: overrides.email ?? 'test@example.com',
  password: overrides.password ?? 'Password123!',
  firstName: overrides.firstName ?? 'Test',
  lastName: overrides.lastName ?? 'User',
  phone: overrides.phone ?? '+33600000000',
  role: overrides.role ?? 'USER',
});
