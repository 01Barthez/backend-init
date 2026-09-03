import { prisma } from '@/shared/infrastructure/database';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type {
  CreateInvitedUserInput,
  UpdateUserProfileInput,
  UserExportRow,
  UserListFilters,
  UserListResult,
  UserLookupRecord,
  UserPublicProfile,
} from '../../domain/types/users.types';

const publicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  isVerified: true,
  isDeleted: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
} as const;

const lookupSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isDeleted: true,
  isActive: true,
  isVerified: true,
} as const;

const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

const buildListWhere = (
  filters: Omit<UserListFilters, 'page' | 'limit'>,
): Record<string, unknown> => {
  const where: Record<string, unknown> = { isDeleted: false };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
  if (filters.isDeleted !== undefined) where.isDeleted = filters.isDeleted;
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { email: { contains: term } },
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { phone: { contains: term } },
    ];
  }
  return where;
};

/**
 * Prisma-backed users administration repository.
 */
export class PrismaUsersRepository implements UsersRepositoryPort {
  async findPublicById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<UserPublicProfile | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(options?.includeDeleted ? {} : { isDeleted: false }),
      },
      select: publicSelect,
    });
    return user;
  }

  async findLookupById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<UserLookupRecord | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(options?.includeDeleted ? {} : { isDeleted: false }),
      },
      select: lookupSelect,
    });
    return user;
  }

  async findLookupByEmail(email: string): Promise<UserLookupRecord | null> {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), isDeleted: false },
      select: lookupSelect,
    });
  }

  async list(filters: UserListFilters): Promise<UserListResult> {
    const { page, limit, ...whereFilters } = filters;
    const skip = (page - 1) * limit;
    const where = buildListWhere(whereFilters);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: publicSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async search(term: string, page: number, limit: number): Promise<UserListResult> {
    const skip = (page - 1) * limit;

    if (isObjectId(term)) {
      const user = await prisma.user.findFirst({
        where: { id: term, isDeleted: false },
        select: publicSelect,
      });
      return { users: user ? [user] : [], total: user ? 1 : 0 };
    }

    const where = {
      isDeleted: false,
      OR: [
        { email: { contains: term } },
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { phone: { contains: term } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: publicSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async exportActive(
    filters: Omit<UserListFilters, 'page' | 'limit'> = {},
  ): Promise<UserExportRow[]> {
    return prisma.user.findMany({
      where: buildListWhere(filters),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    });
  }

  async updateProfile(userId: string, data: UpdateUserProfileInput): Promise<UserPublicProfile> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
      select: publicSelect,
    });
  }

  async setActive(userId: string, isActive: boolean): Promise<UserPublicProfile> {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: publicSelect,
    });
  }

  async markEmailVerified(userId: string): Promise<UserPublicProfile> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
        otp: null,
        otpFailedAttempts: 0,
      },
      select: publicSelect,
    });
  }

  async unlockLogin(userId: string): Promise<UserPublicProfile> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: publicSelect,
    });
  }

  async createInvited(data: CreateInvitedUserInput): Promise<UserPublicProfile> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isVerified: true,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
      select: publicSelect,
    });
  }

  async softDelete(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async restore(userId: string): Promise<UserLookupRecord> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    return prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: false,
        deletedAt: null,
        // Reactivate verified accounts; unverified stay inactive until OTP verify.
        ...(existing?.isVerified ? { isActive: true } : {}),
      },
      select: lookupSelect,
    });
  }

  /**
   * GDPR hard-delete: anonymize PII first. Blogs require `author` without
   * Cascade, so the user row is removed only when no posts remain; otherwise
   * an anonymized stub is kept.
   */
  async hardDelete(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@invalid.local`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
        password: null,
        otp: null,
        totpSecret: null,
        totpEnabled: false,
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.oAuthAccount.deleteMany({ where: { userId } });
    await prisma.blacklistEntry.deleteMany({ where: { userId } });

    await prisma.blog.updateMany({
      where: { authorId: userId, deletedAt: null },
      data: { deletedAt: new Date(), visibility: 'PRIVATE', status: 'ARCHIVED' },
    });

    const remainingBlogs = await prisma.blog.count({ where: { authorId: userId } });
    if (remainingBlogs === 0) {
      await prisma.user.delete({ where: { id: userId } });
    }
  }

  async clearAll(): Promise<void> {
    await prisma.user.deleteMany({});
  }
}
