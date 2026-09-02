import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { comparePassword, hashPassword } from '@/shared/utils/crypto';

import { IncorrectPasswordError } from '../../domain/errors/auth.errors';
import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { ChangePasswordInput } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import type { UserCachePort } from '../services/user-cache.port';

export type ChangePasswordCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  mailer: MailerPort;
  userCache?: UserCachePort;
};

/**
 * Changes password for an authenticated user and revokes every refresh family.
 */
export class ChangePasswordCommand {
  constructor(private readonly deps: ChangePasswordCommandDeps) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const { userId, currentPassword, newPassword } = input;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('Missing required field(s): current_password, new_password');
    }

    const dbUser = await this.deps.userRepository.findById(userId);
    if (!dbUser) {
      throw AppError.notFound('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, dbUser.passwordHash || '');
    if (!isPasswordValid) {
      throw new IncorrectPasswordError();
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.deps.userRepository.update(userId, {
      passwordHash: hashedPassword,
      lastPasswordChange: new Date(),
    });

    await this.deps.tokenRepository.revokeAllForUser(userId, 'PASSWORD_CHANGE');
    await this.deps.userCache?.invalidate(userId, dbUser.email);

    const userFullName = `${dbUser.lastName} ${dbUser.firstName}`;
    this.deps.mailer
      .queue({
        to: dbUser.email,
        subject: MAIL.PASSWORD_CHANGED_SUBJECT,
        template: 'password-changed',
        data: { name: userFullName, date: new Date() },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue password-changed email', {
          userId,
          error: error.message,
        });
      });

    log.info('Password changed successfully', { userId });
  }
}
