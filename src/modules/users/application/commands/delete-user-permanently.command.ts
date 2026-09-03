import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { SessionPort } from '../services/session.port';
import type { UserCachePort } from '../services/user-cache.port';

export type DeleteUserPermanentlyDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  session: SessionPort;
  audit?: AuditPort;
};

/**
 * GDPR hard-delete: anonymize PII, tombstone blogs, drop the row when FKs allow.
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
    await this.deps.session.revokeAllForUser(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    await this.deps.audit?.record({
      action: 'user.hard_delete',
      resource: 'user',
      resourceId: userId,
    });

    log.info('User permanently deleted (PII anonymized)', { userId });
  }
}
