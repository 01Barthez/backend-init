import { SYSTEM_ROLES } from '@/shared/constants/app.constants';

/**
 * Static HTTP / seed-oriented user fixture (presentation payloads).
 * Prefer `tests/factories/user.factory.ts` for domain entities in unit tests.
 */
export const buildUserFixture = (
  overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  }> = {},
) => ({
  email: overrides.email ?? 'test@example.com',
  password: overrides.password ?? 'Password123!',
  firstName: overrides.firstName ?? 'Test',
  lastName: overrides.lastName ?? 'User',
  phone: overrides.phone ?? '+33600000000',
  role: overrides.role ?? SYSTEM_ROLES.USER,
});
