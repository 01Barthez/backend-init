import type { TokenServicePort } from '@/modules/auth';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import { MAIL } from '@/shared/constants/mail.constants';
import log from '@/shared/infrastructure/logging/logger';

import {
  OAuthInvalidProviderError,
  OAuthInvalidStateError,
  OAuthMissingCodeError,
} from '../../domain/errors/oauth.errors';
import type { IOAuthState } from '../../domain/types/oauth.types';
import { OAuthProvider } from '../../domain/types/oauth.types';
import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { CallbackInput, CallbackResult } from '../dto/oauth.dto';

export type CallbackCommandDeps = {
  oauthManager: OAuthManager;
  tokenService: TokenServicePort;
  rbac: RbacPort;
  mailer: MailerPort;
  clientUrl?: string;
};

/**
 * Completes the OAuth code exchange, links/creates the user, and issues tokens.
 */
export class CallbackCommand {
  constructor(private readonly deps: CallbackCommandDeps) {}

  async execute(input: CallbackInput): Promise<CallbackResult> {
    const providerUpper = input.provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      throw new OAuthInvalidProviderError();
    }

    if (input.error) {
      throw new OAuthInvalidStateError(input.errorDescription || 'OAuth authorization failed');
    }

    if (!input.code) {
      throw new OAuthMissingCodeError();
    }

    if (!input.stateCookie || !input.state) {
      throw new OAuthInvalidStateError();
    }

    const stateData: IOAuthState = JSON.parse(Buffer.from(input.stateCookie, 'base64').toString());

    if (stateData.state !== input.state || !this.deps.oauthManager.verifyState(stateData)) {
      throw new OAuthInvalidStateError();
    }

    const tokenData = await this.deps.oauthManager.exchangeCodeForToken(providerUpper, input.code);
    const userProfile = await this.deps.oauthManager.getUserProfile(
      providerUpper,
      tokenData.access_token,
    );
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

    const userFullName = `${user.lastName} ${user.firstName}`;
    if (isNewUser) {
      this.deps.mailer
        .queue({
          to: user.email,
          subject: MAIL.WELCOME_SUBJECT,
          template: 'welcome',
          data: { name: userFullName },
        })
        .catch((mailError: Error) => {
          log.warn('Failed to queue welcome email', {
            email: user.email,
            error: mailError.message,
          });
        });
    } else {
      this.deps.mailer
        .queue({
          to: user.email,
          subject: MAIL.LOGIN_ALERT_SUBJECT,
          template: 'alert-login',
          data: { name: userFullName, date: new Date() },
        })
        .catch((mailError: Error) => {
          log.warn('Failed to queue login alert email', {
            email: user.email,
            error: mailError.message,
          });
        });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileUrl: user.avatarUrl,
      isNewUser,
      roles,
      permissions,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      redirectUrl: stateData.redirectUrl || this.deps.clientUrl,
    };
  }
}
