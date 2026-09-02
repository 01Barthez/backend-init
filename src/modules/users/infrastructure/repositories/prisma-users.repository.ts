import { prisma } from '@/shared/infrastructure/database';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type {
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
  createdAt: true,
  updatedAt: true,
} as const;

const lookupSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isDeleted: true,
} as const;

const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

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

  async list(filters: UserListFilters): Promise<UserListResult> {
    const { page, limit, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (whereFilters.isActive !== undefined) where.isActive = whereFilters.isActive;
    if (whereFilters.isVerified !== undefined) where.isVerified = whereFilters.isVerified;
    if (whereFilters.isDeleted !== undefined) where.isDeleted = whereFilters.isDeleted;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async search(term: string): Promise<UserPublicProfile[] | UserPublicProfile | null> {
    if (typeof term === 'string' && term.includes('@')) {
      return prisma.user.findMany({
        where: {
          isDeleted: false,
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
        },
        take: 20,
      });
    }

    if (isObjectId(term)) {
      return prisma.user.findFirst({
        where: { id: term, isDeleted: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return prisma.user.findMany({
      where: {
        isDeleted: false,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20,
    });
  }

  async exportActive(): Promise<UserExportRow[]> {
    return prisma.user.findMany({
      where: { isDeleted: false },
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
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
      },
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
    return prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      select: lookupSelect,
    });
  }

  async hardDelete(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  }

  async clearAll(): Promise<void> {
    await prisma.user.deleteMany({});
  }
}
