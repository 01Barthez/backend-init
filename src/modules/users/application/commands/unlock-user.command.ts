import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserPublicProfile } from '../../domain/types/users.types';
import type { UserCachePort } from '../services/user-cache.port';

export type UnlockUserDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  audit?: AuditPort;
};

/**
 * Clears login lockout counters (`failedLoginAttempts` / `lockedUntil`).
 */
export class UnlockUserCommand {
  constructor(private readonly deps: UnlockUserDeps) {}

  async execute(userId: string): Promise<UserPublicProfile> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const existing = await this.deps.usersRepository.findLookupById(userId);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    const user = await this.deps.usersRepository.unlockLogin(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    await this.deps.audit?.record({
      action: 'user.unlock',
      resource: 'user',
      resourceId: userId,
    });

    log.info('User login unlocked', { userId });
    return user;
  }
}
