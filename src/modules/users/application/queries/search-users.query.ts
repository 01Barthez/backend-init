import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { ListUsersResult, SearchUsersInput } from '../dto/users.dto';
import type { UserCachePort } from '../services/user-cache.port';

export type SearchUsersDeps = {
  userCache: UserCachePort;
};

const MAX_LIMIT = 50;

/**
 * Paginated free-text user search (email, name, phone, or ObjectId).
 * Does not log matching rows — PII stays out of application logs.
 */
export class SearchUsersQuery {
  constructor(private readonly deps: SearchUsersDeps) {}

  async execute(input: SearchUsersInput): Promise<ListUsersResult> {
    const search = input.search?.trim();
    if (!search) {
      throw AppError.badRequest('Search query is required');
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = Math.min(MAX_LIMIT, input.limit && input.limit > 0 ? input.limit : 20);

    const { users, total } = await this.deps.userCache.getSearch(search, page, limit);
    const totalPages = Math.ceil(total / limit) || 0;

    log.info('User search completed', { resultCount: total, page, limit });
    return { users, total, page, limit, totalPages };
  }
}
