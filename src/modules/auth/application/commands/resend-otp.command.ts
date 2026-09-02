import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import generateOtp from '@/shared/utils/otp/generate-otp';
import { getOtpExpirationDate } from '@/shared/utils/otp/otp-expiration';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { ResendOtpInput, ResendOtpResult } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import { hashOtpCode } from '../services/otp-hash';
import type { UserCachePort } from '../services/user-cache.port';

export type ResendOtpCommandDeps = {
  userRepository: UserRepositoryPort;
  mailer: MailerPort;
  userCache?: UserCachePort;
};

/**
 * Issues a fresh OTP for an unverified account and queues the email.
 * Unlike signup, a mail failure surfaces as an error (user expects delivery).
 */
export class ResendOtpCommand {
  constructor(private readonly deps: ResendOtpCommandDeps) {}

  async execute(input: ResendOtpInput): Promise<ResendOtpResult> {
    const { email } = input;

    if (!email) {
      throw AppError.badRequest('Email is required');
    }

    const user = await this.deps.userRepository.findByEmail(email);
    if (!user || user.isVerified) {
      return { emailSent: true };
    }

    const userOtp = generateOtp();
    const now = new Date();
    const otpExpireDate = getOtpExpirationDate(now);

    await this.deps.userRepository.update(user.id, {
      otp: { code: hashOtpCode(email, userOtp), expireAt: otpExpireDate },
      otpFailedAttempts: 0,
    });

    await this.deps.userCache?.invalidate(user.id, email);

    const userFullName = `${user.lastName} ${user.firstName}`;

    try {
      await this.deps.mailer.queue({
        to: email,
        subject: MAIL.OTP_SUBJECT,
        template: 'otp',
        data: { date: now, name: userFullName, otp: userOtp },
      });
      log.info('OTP resent successfully', { email });
    } catch (mailError: unknown) {
      const message = mailError instanceof Error ? mailError.message : String(mailError);
      log.error('Failed to resend OTP email', { email, error: message });
      throw AppError.unprocessable('Failed to send OTP email');
    }

    return { emailSent: true };
  }
}
