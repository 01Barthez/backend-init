import { envs } from '@/app/config';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { ForgotPasswordInput, ForgotPasswordResult } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import type { TokenServicePort } from '../services/token.service.port';

const GENERIC_MESSAGE = 'If an account exists for this email, a reset link has been sent';

export type ForgotPasswordCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenService: TokenServicePort;
  mailer: MailerPort;
};

/**
 * Sends a password-reset link when the email exists.
 * Response is identical for unknown emails (no enumeration).
 * The token is an opaque random value (hashed in Redis), not a JWT in the URL.
 */
export class ForgotPasswordCommand {
  constructor(private readonly deps: ForgotPasswordCommandDeps) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    const { email } = input;

    if (!email) {
      throw AppError.badRequest('Email is required');
    }

    const user = await this.deps.userRepository.findByEmail(email);
    if (!user) {
      return { emailSent: true, message: GENERIC_MESSAGE };
    }

    const resetToken = await this.deps.tokenService.createPasswordResetToken(user.id);
    const resetLink = `${envs.CLIENT_URL}/reset-password?token=${resetToken}`;
    const userFullName = `${user.lastName} ${user.firstName}`;

    try {
      await this.deps.mailer.queue({
        to: email,
        subject: MAIL.RESET_PWD_SUBJECT,
        template: 'reset-password',
        data: { name: userFullName, resetLink },
      });
      log.info('Password reset email queued', { email });
    } catch (mailError: unknown) {
      const message = mailError instanceof Error ? mailError.message : String(mailError);
      log.error('Failed to queue password reset email', { email, error: message });
    }

    return { emailSent: true, message: GENERIC_MESSAGE };
  }
}
