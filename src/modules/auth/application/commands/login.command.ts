import { config } from '@/app/config';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { comparePassword, DUMMY_PASSWORD_HASH } from '@/shared/utils/crypto';

import {
  AccountInactiveError,
  AccountLockedError,
  AccountNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { LoginInput, LoginResult } from '../dto/auth.dto';
import type { MailerPort } from '../services/mailer.port';
import type { RbacPort } from '../services/rbac.port';
import type { TokenServicePort } from '../services/token.service.port';

export type LoginCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenService: TokenServicePort;
  rbac: RbacPort;
  mailer: MailerPort;
};

const isLocked = (lockedUntil?: Date | null): boolean =>
  Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

/**
 * Authenticates a verified user and issues a token pair.
 *
 * Session model: `isActive` is account status (admin disable), not "logged in".
 * Failed attempts use `failedLoginAttempts` / `lockedUntil`.
 */
export class LoginCommand {
  constructor(private readonly deps: LoginCommandDeps) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    if (!email || !password) {
      throw AppError.badRequest('Missing required field(s): email, password');
    }

    const user = await this.deps.userRepository.findByEmail(email);

    if (user && isLocked(user.lockedUntil)) {
      throw new AccountLockedError();
    }

    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
    const isPasswordValid = await comparePassword(password, passwordHash);

    if (!user || !user.passwordHash || !isPasswordValid) {
      if (user) {
        await this.registerFailure(user.id, user.failedLoginAttempts ?? 0);
      }
      throw new InvalidCredentialsError();
    }

    if (!user.isVerified) {
      throw new AccountNotVerifiedError();
    }

    if (!user.isActive) {
      throw new AccountInactiveError();
    }

    await this.deps.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const { permissions, roles } = await this.deps.rbac.getUserAuthContext(user.id);
    const tokenPair = this.deps.tokenService.issueTokenPair(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      permissions,
      roles,
    );

    await this.deps.tokenService.persistRefreshToken(
      user.id,
      tokenPair.refreshToken,
      tokenPair.refreshJti,
      tokenPair.familyId,
    );

    const userFullName = `${user.lastName} ${user.firstName}`;
    this.deps.mailer
      .queue({
        to: email,
        subject: MAIL.LOGIN_ALERT_SUBJECT,
        template: 'alert-login',
        data: { name: userFullName, date: new Date() },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue login alert email', { email, error: error.message });
      });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileUrl: user.avatarUrl,
      roles,
      permissions,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  private async registerFailure(userId: string, previous: number): Promise<void> {
    const next = previous + 1;
    const max = config.security.lockout.maxLoginAttempts;
    const lockedUntil =
      next >= max ? new Date(Date.now() + config.security.lockout.lockoutMs) : null;

    await this.deps.userRepository.update(userId, {
      failedLoginAttempts: next,
      lockedUntil,
    });
  }
}
