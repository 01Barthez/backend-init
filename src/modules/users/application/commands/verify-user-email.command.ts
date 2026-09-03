import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserPublicProfile } from '../../domain/types/users.types';
import type { UserCachePort } from '../services/user-cache.port';

export type VerifyUserEmailDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  audit?: AuditPort;
};

/**
 * Admin marks an account email as verified (imported / invited / support ops).
 */
export class VerifyUserEmailCommand {
  constructor(private readonly deps: VerifyUserEmailDeps) {}

  async execute(userId: string): Promise<UserPublicProfile> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const existing = await this.deps.usersRepository.findLookupById(userId);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    const user = await this.deps.usersRepository.markEmailVerified(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    await this.deps.audit?.record({
      action: 'user.verify_email',
      resource: 'user',
      resourceId: userId,
    });

    log.info('User email marked verified by admin', { userId });
    return user;
  }
}
