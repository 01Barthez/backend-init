import type { TokenServicePort } from '@/modules/auth';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { CallbackResult, TelegramAuthInput } from '../dto/oauth.dto';

export type TelegramAuthCommandDeps = {
  oauthManager: OAuthManager;
  tokenService: TokenServicePort;
  rbac: RbacPort;
  mailer: MailerPort;
};

/**
 * Authenticates via Telegram Login Widget (HMAC verification).
 */
export class TelegramAuthCommand {
  constructor(private readonly deps: TelegramAuthCommandDeps) {}

  async execute(input: TelegramAuthInput): Promise<CallbackResult> {
    const authData = input.authData;
    if (!authData?.hash) {
      throw AppError.badRequest('Invalid Telegram authentication data');
    }

    const telegramService = this.deps.oauthManager.getTelegramService();
    const isValid = telegramService.verifyTelegramAuth(authData as any);
    if (!isValid) {
      throw AppError.unauthorized('Invalid Telegram authentication');
    }

    const userProfile = telegramService.getUserProfile(authData as any);
    if (!userProfile.email) {
      userProfile.email = `telegram_${userProfile.providerUserId}@telegram.oauth`;
    }

    const tokenData = {
      access_token: String(authData.hash),
      token_type: 'telegram',
      scope: 'read',
    };

    const { user, isNewUser } = await this.deps.oauthManager.findOrCreateUser(
      userProfile,
      tokenData,
    );

    if (isNewUser) {
      await this.deps.rbac.assignDefaultRole(user.id);
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

    if (isNewUser && user.email && !user.email.includes('@telegram.oauth')) {
      const userFullName = `${user.lastName} ${user.firstName}`;
      this.deps.mailer
        .queue({
          to: user.email,
          subject: MAIL.WELCOME_SUBJECT,
          template: 'welcome',
          data: { name: userFullName },
        })
        .catch((mailError: Error) => {
          log.warn('Failed to queue welcome email', { error: mailError.message });
        });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileUrl: user.avatarUrl,
      isNewUser,
      roles,
      permissions,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }
}
