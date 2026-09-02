import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import type { UserEntity } from '@/modules/auth/domain/entities/user.entity';

let seq = 0;

const nextId = (): string => {
  seq += 1;
  return `user_${seq.toString().padStart(4, '0')}`;
};

export type UserFactoryInput = Partial<UserEntity> & {
  password?: string;
  roleSlug?: string;
};

/**
 * Builds a domain UserEntity for unit / use-case tests (no Prisma types).
 */
export const buildUserEntity = (overrides: UserFactoryInput = {}): UserEntity => ({
  id: overrides.id ?? nextId(),
  email: overrides.email ?? `user${seq || 1}@example.com`,
  firstName: overrides.firstName ?? 'Test',
  lastName: overrides.lastName ?? 'User',
  passwordHash: overrides.passwordHash ?? 'hashed-password',
  phone: overrides.phone ?? '+33600000000',
  avatarUrl: overrides.avatarUrl ?? null,
  isVerified: overrides.isVerified ?? true,
  isActive: overrides.isActive ?? true,
  isDeleted: overrides.isDeleted ?? false,
});

/**
 * Signup / HTTP body payload (presentation layer).
 */
export const buildSignupPayload = (
  overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }> = {},
) => ({
  email: overrides.email ?? `signup_${Date.now()}@example.com`,
  password: overrides.password ?? 'Password123!',
  firstName: overrides.firstName ?? 'Test',
  lastName: overrides.lastName ?? 'User',
  phone: overrides.phone ?? '+33600000000',
});

export const defaultRoleSlug = SYSTEM_ROLES.USER;
