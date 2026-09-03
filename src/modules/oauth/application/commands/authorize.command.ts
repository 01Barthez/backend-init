import { envs } from '@/app/config';

import { OAuthInvalidProviderError } from '../../domain/errors/oauth.errors';
import { OAuthProvider } from '../../domain/types/oauth.types';
import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { AuthorizeInput, AuthorizeResult } from '../dto/oauth.dto';
import { resolveAllowedRedirect } from '../services/allowed-redirect';
import { assertOAuthEnabled } from '../services/assert-oauth-enabled';
import type { OAuthFeatureFlagPort } from '../services/oauth-feature-flag.port';

export type AuthorizeCommandDeps = {
  oauthManager: OAuthManager;
  clientUrl?: string;
  featureFlags?: OAuthFeatureFlagPort;
};

/**
 * Starts the OAuth authorization redirect flow for a provider.
 */
export class AuthorizeCommand {
  constructor(private readonly deps: AuthorizeCommandDeps) {}

  async execute(input: AuthorizeInput): Promise<AuthorizeResult> {
    await assertOAuthEnabled(this.deps.featureFlags);

    const providerUpper = input.provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      throw new OAuthInvalidProviderError();
    }

    const redirectUrl = resolveAllowedRedirect(
      input.redirectUrl,
      this.deps.clientUrl || envs.CLIENT_URL,
      envs.OAUTH_ALLOWED_ORIGINS as string,
    );

    const stateData = this.deps.oauthManager.generateState(redirectUrl);
    const stateCookieValue = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const authUrl = this.deps.oauthManager.getAuthorizationUrl(providerUpper, stateData.state);

    return {
      authUrl,
      stateCookieValue,
      stateCookieMaxAgeMs: 15 * 60 * 1000,
    };
  }
}
