import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserCachePort } from '../services/user-cache.port';

export type DeleteUserPermanentlyDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
};

/**
 * Hard-deletes a user row. Irreversible — prefer soft-delete in production flows.
 */
export class DeleteUserPermanentlyCommand {
  constructor(private readonly deps: DeleteUserPermanentlyDeps) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const user = await this.deps.usersRepository.findLookupById(userId, { includeDeleted: true });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await this.deps.usersRepository.hardDelete(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    log.info('User permanently deleted', { userId });
  }
}
