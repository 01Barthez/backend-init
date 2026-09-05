import prisma from '@/shared/infrastructure/database/prisma.client';

import type {
  CreateUserInput,
  UpdateUserInput,
  UserEntity,
} from '../../domain/entities/user.entity';
import type {
  ClaimEmailVerificationData,
  UserRepositoryPort,
} from '../../domain/repositories/user.repository';
import { UserMapper } from '../persistence/user.mapper';

/**
 * Prisma-backed UserRepositoryPort.
 * Soft-deleted users are excluded by default (isDeleted: false).
 */
export class PrismaUserRepository implements UserRepositoryPort {
  async findByEmail(
    email: string,
    options?: { includeDeleted?: boolean },
  ): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(options?.includeDeleted ? {} : { isDeleted: false }),
      },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findById(id: string, options?: { includeDeleted?: boolean }): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(options?.includeDeleted ? {} : { isDeleted: false }),
      },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    const created = await prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        otp: {
          code: data.otp.code,
          expireAt: data.otp.expireAt,
        },
      },
    });
    return UserMapper.toDomain(created);
  }

  async update(id: string, data: UpdateUserInput): Promise<UserEntity> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.passwordHash !== undefined ? { password: data.passwordHash } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isDeleted !== undefined ? { isDeleted: data.isDeleted } : {}),
        ...(data.emailVerifiedAt !== undefined ? { emailVerifiedAt: data.emailVerifiedAt } : {}),
        ...(data.failedLoginAttempts !== undefined
          ? { failedLoginAttempts: data.failedLoginAttempts }
          : {}),
        ...(data.lockedUntil !== undefined ? { lockedUntil: data.lockedUntil } : {}),
        ...(data.otpFailedAttempts !== undefined
          ? { otpFailedAttempts: data.otpFailedAttempts }
          : {}),
        ...(data.lastLoginAt !== undefined ? { lastLoginAt: data.lastLoginAt } : {}),
        ...(data.lastPasswordChange !== undefined
          ? { lastPasswordChange: data.lastPasswordChange }
          : {}),
        ...(data.totpSecret !== undefined ? { totpSecret: data.totpSecret } : {}),
        ...(data.totpEnabled !== undefined ? { totpEnabled: data.totpEnabled } : {}),
        ...(data.otp !== undefined
          ? data.otp === null
            ? { otp: null }
            : { otp: { code: data.otp.code, expireAt: data.otp.expireAt } }
          : {}),
      },
    });
    return UserMapper.toDomain(updated);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  async claimEmailVerification(userId: string, data: ClaimEmailVerificationData): Promise<boolean> {
    const result = await prisma.user.updateMany({
      where: { id: userId, isVerified: false },
      data: {
        isVerified: true,
        isActive: true,
        otp: null,
        otpFailedAttempts: 0,
        emailVerifiedAt: data.emailVerifiedAt,
      },
    });
    return result.count === 1;
  }

  async incrementOtpFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { otpFailedAttempts: { increment: 1 } },
    });
  }

  async incrementFailedLoginAttempts(userId: string): Promise<number> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    return updated.failedLoginAttempts;
  }
}
