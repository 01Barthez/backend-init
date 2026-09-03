import type { UserListFilters, UserListResult } from '../../domain/types/users.types';

/**
 * Read-through cache + invalidation for user list/search/profile keys.
 */
export interface UserCachePort {
  getList(filters: UserListFilters): Promise<UserListResult>;

  getSearch(term: string, page: number, limit: number): Promise<UserListResult>;

  invalidate(userId: string, email?: string): Promise<void>;

  invalidateAll(): Promise<void>;
}
