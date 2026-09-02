import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { MailerPort } from '../services/mailer.port';
import type { UserCachePort } from '../services/user-cache.port';

export type DeleteUserDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  mailer: MailerPort;
};

/**
 * Soft-deletes a user (isDeleted + inactive) and notifies them by email.
 */
export class DeleteUserCommand {
  constructor(private readonly deps: DeleteUserDeps) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const user = await this.deps.usersRepository.findLookupById(userId, { includeDeleted: true });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await this.deps.usersRepository.softDelete(userId);
    await this.deps.userCache.invalidate(userId, user.email);

    const userFullName = `${user.lastName} ${user.firstName}`;
    this.deps.mailer
      .queue({
        to: user.email,
        subject: MAIL.ACCOUNT_DELETED_SUBJECT,
        template: 'account-deleted',
        data: { name: userFullName, date: new Date() },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue account-deleted email', { userId, error: error.message });
      });

    log.info('User soft deleted', { userId });
  }
}
