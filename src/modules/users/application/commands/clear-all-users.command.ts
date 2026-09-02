import { envs } from '@/app/config';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserCachePort } from '../services/user-cache.port';

export type ClearAllUsersDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
};

/**
 * Development-only: wipe all users. Blocked outside NODE_ENV=development.
 */
export class ClearAllUsersCommand {
  constructor(private readonly deps: ClearAllUsersDeps) {}

  async execute(): Promise<void> {
    if (envs.NODE_ENV !== 'development') {
      throw AppError.forbidden('This action is only allowed in development environment');
    }

    await this.deps.usersRepository.clearAll();
    await this.deps.userCache.invalidateAll();

    log.warn('All users cleared from database');
  }
}
