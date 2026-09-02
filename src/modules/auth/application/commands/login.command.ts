import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { comparePassword } from '@/shared/utils/crypto';

import { AccountNotVerifiedError, InvalidCredentialsError } from '../../domain/errors/auth.errors';
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

/**
 * Authenticates a verified user, issues a token pair, and queues a login alert.
 */
export class LoginCommand {
  constructor(private readonly deps: LoginCommandDeps) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    if (!email || !password) {
      throw AppError.badRequest('Missing required field(s): email, password');
    }

    const user = await this.deps.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.isVerified) {
      throw new AccountNotVerifiedError();
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

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

    await this.deps.userRepository.setActive(user.id, true);

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
}
