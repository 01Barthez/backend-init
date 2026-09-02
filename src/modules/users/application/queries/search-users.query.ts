import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { SearchUsersResult } from '../dto/users.dto';
import type { UserCachePort } from '../services/user-cache.port';

export type SearchUsersDeps = {
  userCache: UserCachePort;
};

/**
 * Cached free-text user search (email, name, phone, or ObjectId).
 */
export class SearchUsersQuery {
  constructor(private readonly deps: SearchUsersDeps) {}

  async execute(search: string): Promise<SearchUsersResult> {
    if (!search) {
      throw AppError.badRequest('Search query is required');
    }

    const users = (await this.deps.userCache.getSearch(search)) || [];
    log.info('User search completed', { query: search, results: users });
    return users;
  }
}
