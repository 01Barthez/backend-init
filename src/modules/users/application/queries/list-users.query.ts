import log from '@/shared/infrastructure/logging/logger';

import type { ListUsersInput, ListUsersResult } from '../dto/users.dto';
import type { UserCachePort } from '../services/user-cache.port';

export type ListUsersDeps = {
  userCache: UserCachePort;
};

/**
 * Paginated user list with optional activity / verification filters.
 */
export class ListUsersQuery {
  constructor(private readonly deps: ListUsersDeps) {}

  async execute(input: ListUsersInput = {}): Promise<ListUsersResult> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? input.limit : 10;

    const filters = {
      page,
      limit,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.isVerified !== undefined ? { isVerified: input.isVerified } : {}),
      ...(input.isDeleted !== undefined ? { isDeleted: input.isDeleted } : {}),
    };

    const { users, total } = await this.deps.userCache.getList(filters);
    const totalPages = Math.ceil(total / limit) || 0;

    log.info('Users list retrieved', { page, limit, total });

    return { users, total, page, limit, totalPages };
  }
}
