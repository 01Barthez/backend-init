import { config } from '@/app/config';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import {
  AccountLockedError,
  InvalidOtpError,
  OtpExpiredError,
} from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { VerifyOtpInput, VerifyOtpResult } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import { otpMatches } from '../services/otp-hash';
import type { UserCachePort } from '../services/user-cache.port';

export type VerifyOtpCommandDeps = {
  userRepository: UserRepositoryPort;
  mailer: MailerPort;
  userCache?: UserCachePort;
};

/**
 * Verifies signup OTP, activates the account, and queues a welcome email.
 * Unknown emails return the same InvalidOtpError as a bad code (no enumeration).
 */
export class VerifyOtpCommand {
  constructor(private readonly deps: VerifyOtpCommandDeps) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const { email, otp } = input;

    if (!email || !otp) {
      throw AppError.badRequest('Missing required field(s): email, otp');
    }

    const user = await this.deps.userRepository.findByEmail(email);
    if (!user || user.isVerified || !user.otp?.code) {
      throw new InvalidOtpError();
    }

    if ((user.otpFailedAttempts ?? 0) >= config.security.lockout.maxOtpAttempts) {
      throw new AccountLockedError();
    }

    if (user.otp.expireAt && user.otp.expireAt < new Date()) {
      throw new OtpExpiredError();
    }

    if (!otpMatches(email, otp, user.otp.code)) {
      await this.deps.userRepository.incrementOtpFailedAttempts(user.id);
      throw new InvalidOtpError();
    }

    const now = new Date();
    const claimed = await this.deps.userRepository.claimEmailVerification(user.id, {
      emailVerifiedAt: now,
    });
    if (!claimed) {
      throw new InvalidOtpError();
    }

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
