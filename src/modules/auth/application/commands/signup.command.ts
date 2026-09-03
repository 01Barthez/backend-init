import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { hashPassword } from '@/shared/utils/crypto';
import generateOtp from '@/shared/utils/otp/generate-otp';
import { getOtpExpirationDate } from '@/shared/utils/otp/otp-expiration';

import { EmailAlreadyExistsError } from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { SignupInput, SignupResult } from '../dto/auth.dto';
import type { AvatarUploaderPort } from '../services/avatar-uploader.port';
import type { MailerPort } from '../services/mailer.port';
import { hashOtpCode } from '../services/otp-hash';
import type { RbacPort } from '../services/rbac.port';

export type SignupCommandDeps = {
  userRepository: UserRepositoryPort;
  rbac: RbacPort;
  mailer: MailerPort;
  avatarUploader: AvatarUploaderPort;
};

/**
 * Registers a new user, assigns the default role, and queues an OTP email.
 */
export class SignupCommand {
  constructor(private readonly deps: SignupCommandDeps) {}

  async execute(input: SignupInput): Promise<SignupResult> {
    const { email, password, firstName, lastName, phone, avatarFile } = input;

    const missing = (['email', 'password', 'firstName', 'lastName', 'phone'] as const).filter(
      (field) => !input[field],
    );
    if (missing.length > 0) {
      throw AppError.badRequest(`Missing required field(s): ${missing.join(', ')}`);
    }

    const existingUser = await this.deps.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const profileUrl = await this.deps.avatarUploader.upload(avatarFile);
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      throw AppError.internal('Failed to hash password');
    }

    const userOtp = generateOtp();
    const now = new Date();
    const otpExpireDate = getOtpExpirationDate(now);

    const newUser = await this.deps.userRepository.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      phone,
      avatarUrl: profileUrl,
      otp: {
        code: hashOtpCode(email, userOtp),
        expireAt: otpExpireDate,
      },
    });

    if (!newUser) {
      throw AppError.badRequest('failed to create user');
    }

    await this.deps.rbac.assignDefaultRole(newUser.id);

    const userFullName = `${lastName} ${firstName}`;
    this.deps.mailer
      .queue({
        to: email,
        subject: MAIL.OTP_SUBJECT,
        template: 'otp',
        data: { date: now, name: userFullName, otp: userOtp },
      })
      .catch((mailError: Error) => {
        log.warn('Failed to queue OTP email, but user was created successfully', {
          email,
          error: mailError.message,
        });
      });

    log.info('User created successfully', { email });

    return {
      email,
      firstName,
      lastName,
      phone,
      profileUrl,
      otp: { otpExpireDate },
    };
  }
}
