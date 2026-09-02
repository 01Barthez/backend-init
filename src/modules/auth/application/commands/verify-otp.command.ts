import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import { InvalidOtpError, OtpExpiredError } from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { VerifyOtpInput, VerifyOtpResult } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import type { UserCachePort } from '../services/user-cache.port';

export type VerifyOtpCommandDeps = {
  userRepository: UserRepositoryPort;
  mailer: MailerPort;
  userCache?: UserCachePort;
};

/**
 * Verifies signup OTP, activates the account, and queues a welcome email.
 */
export class VerifyOtpCommand {
  constructor(private readonly deps: VerifyOtpCommandDeps) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const { email, otp } = input;

    if (!email || !otp) {
      throw AppError.badRequest('Missing required field(s): email, otp');
    }

    const user = await this.deps.userRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.isVerified) {
      throw AppError.conflict('User already verified');
    }

    if (user.otp?.code !== otp) {
      throw new InvalidOtpError();
    }

    const now = new Date();
    if (user.otp?.expireAt && user.otp.expireAt < now) {
      throw new OtpExpiredError();
    }

    await this.deps.userRepository.update(user.id, {
      isVerified: true,
      otp: null,
      emailVerifiedAt: now,
    });

    await this.deps.userCache?.invalidate(user.id, email);

    const userFullName = `${user.lastName} ${user.firstName}`;
    this.deps.mailer
      .queue({
        to: email,
        subject: MAIL.WELCOME_SUBJECT,
        template: 'welcome',
        data: { name: userFullName },
      })
      .catch((error: Error) => {
        log.warn('Failed to send welcome email', { email, error: error.message });
      });

    log.info('User verified successfully', { userId: user.id, email });

    return { email };
  }
}
