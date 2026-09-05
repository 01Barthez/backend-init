import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserPublicProfile } from '../../domain/types/users.types';
import { assertNotLastAdmin, assertNotSelfTarget } from '../services/admin-guards';
import type { RbacPort } from '../services/rbac.port';
import type { SessionPort } from '../services/session.port';
import type { UserCachePort } from '../services/user-cache.port';

export type SetUserActiveDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  session: SessionPort;
  rbac: RbacPort;
  audit?: AuditPort;
};

/**
 * Activates or deactivates an account.
 * Deactivate always revokes refresh sessions so JWT access dies at next refresh.
 */
export class SetUserActiveCommand {
  constructor(private readonly deps: SetUserActiveDeps) {}

  async execute(userId: string, isActive: boolean, actorId: string): Promise<UserPublicProfile> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    assertNotSelfTarget(actorId, userId, isActive ? 'activate' : 'deactivate');

    if (!isActive) {
      await assertNotLastAdmin(this.deps.rbac, userId);
    }

    const existing = await this.deps.usersRepository.findLookupById(userId);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    if (existing.isDeleted) {
      throw AppError.badRequest('Cannot change activity on a soft-deleted user — restore first');
    }

    const user = await this.deps.usersRepository.setActive(userId, isActive);
    await this.deps.userCache.invalidate(userId, user.email);

    if (!isActive) {
      await this.deps.session.revokeAllForUser(userId);
    }

    await this.deps.audit?.record({
      action: isActive ? 'user.activate' : 'user.deactivate',
      resource: 'user',
      resourceId: userId,
    });

    log.info(isActive ? 'User activated' : 'User deactivated', { userId });
    return user;
  }
}
