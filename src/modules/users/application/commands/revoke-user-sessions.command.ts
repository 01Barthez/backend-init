import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { SessionPort } from '../services/session.port';

export type RevokeUserSessionsDeps = {
  usersRepository: UsersRepositoryPort;
  session: SessionPort;
  audit?: AuditPort;
};

/**
 * Force-logout: revoke every refresh family for the target user.
 */
export class RevokeUserSessionsCommand {
  constructor(private readonly deps: RevokeUserSessionsDeps) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const existing = await this.deps.usersRepository.findLookupById(userId);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    await this.deps.session.revokeAllForUser(userId);

    await this.deps.audit?.record({
      action: 'user.revoke_sessions',
      resource: 'user',
      resourceId: userId,
    });

    log.info('All user sessions revoked by admin', { userId });
  }
}
