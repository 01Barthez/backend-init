import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserLookupRecord } from '../../domain/types/users.types';
import type { MailerPort } from '../services/mailer.port';
import type { UserCachePort } from '../services/user-cache.port';

export type RestoreUserDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  mailer: MailerPort;
  audit?: AuditPort;
};

/**
 * Restores a soft-deleted user (reactivates when verified) and notifies them.
 */
export class RestoreUserCommand {
  constructor(private readonly deps: RestoreUserDeps) {}

  async execute(userId: string): Promise<UserLookupRecord> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const existing = await this.deps.usersRepository.findLookupById(userId, {
      includeDeleted: true,
    });
    if (!existing?.isDeleted) {
      throw AppError.notFound('User not found');
    }

    const user = await this.deps.usersRepository.restore(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    await this.deps.audit?.record({
      action: 'user.restore',
      resource: 'user',
      resourceId: userId,
    });

    const userFullName = `${user.lastName} ${user.firstName}`;
    this.deps.mailer
      .queue({
        to: user.email,
        subject: MAIL.ACCOUNT_RESTORED_SUBJECT,
        template: 'account-restored',
        data: { name: userFullName, date: new Date() },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue account-restored email', { userId, error: error.message });
      });

    log.info('User restored', { userId });
    return user;
  }
}
