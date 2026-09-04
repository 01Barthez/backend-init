import { envs } from '@/app/config';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import generateOtp from '@/shared/utils/otp/generate-otp';
import { getOtpExpirationDate } from '@/shared/utils/otp/otp-expiration';

import { OtpResendCooldownError } from '../../domain/errors/auth.errors';
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
 * Enforces a short cooldown after the previous issue (signup or resend).
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

    this.assertResendAllowed(user.otp?.expireAt);

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

  /**
   * OTP `expireAt` is issuedAt + OTP_DELAY, so issuedAt = expireAt - OTP_DELAY.
   */
  private assertResendAllowed(expireAt: Date | undefined | null): void {
    if (!expireAt) return;

    const cooldownMs = envs.OTP_RESEND_COOLDOWN;
    if (!Number.isFinite(cooldownMs) || cooldownMs <= 0) return;

    const issuedAtMs = new Date(expireAt).getTime() - envs.OTP_DELAY;
    if (!Number.isFinite(issuedAtMs)) return;

    const elapsedMs = Date.now() - issuedAtMs;
    const remainingMs = cooldownMs - elapsedMs;
    if (remainingMs > 0) {
      throw new OtpResendCooldownError(remainingMs / 1000);
    }
  }
}
