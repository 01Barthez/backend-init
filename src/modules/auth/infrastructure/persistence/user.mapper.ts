import type { User } from '@prisma/client';

import type { UserEntity, UserOtp } from '../../domain/entities/user.entity';

type PrismaUserLike = Pick<
  User,
  | 'id'
  | 'email'
  | 'password'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'avatarUrl'
  | 'isVerified'
  | 'isActive'
  | 'isDeleted'
  | 'emailVerifiedAt'
  | 'failedLoginAttempts'
  | 'lockedUntil'
  | 'otpFailedAttempts'
  | 'totpSecret'
  | 'totpEnabled'
  | 'createdAt'
  | 'updatedAt'
> & {
  otp?: { code: string; expireAt: Date } | null;
};

/**
 * Maps Prisma User rows ↔ domain UserEntity.
 * Isolates the `password` column rename to `passwordHash` in one place.
 */
export const UserMapper = {
  toDomain(row: PrismaUserLike): UserEntity {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      passwordHash: row.password,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      isVerified: row.isVerified,
      isActive: row.isActive,
      isDeleted: row.isDeleted,
      otp: row.otp
        ? ({ code: row.otp.code, expireAt: row.otp.expireAt } satisfies UserOtp)
        : row.otp === null
          ? null
          : undefined,
      emailVerifiedAt: row.emailVerifiedAt,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      otpFailedAttempts: row.otpFailedAttempts,
      totpSecret: row.totpSecret,
      totpEnabled: row.totpEnabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  toPersistencePassword(passwordHash: string | null | undefined): string | undefined {
    return passwordHash ?? undefined;
  },
};
