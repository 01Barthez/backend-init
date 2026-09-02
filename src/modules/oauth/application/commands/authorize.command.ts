import { OAuthInvalidProviderError } from '../../domain/errors/oauth.errors';
import { OAuthProvider } from '../../domain/types/oauth.types';
import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { AuthorizeInput, AuthorizeResult } from '../dto/oauth.dto';

export type AuthorizeCommandDeps = {
  oauthManager: OAuthManager;
};

/**
 * Starts the OAuth authorization redirect flow for a provider.
 */
export class AuthorizeCommand {
  constructor(private readonly deps: AuthorizeCommandDeps) {}

  execute(input: AuthorizeInput): AuthorizeResult {
    const providerUpper = input.provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      throw new OAuthInvalidProviderError();
    }

    const stateData = this.deps.oauthManager.generateState(input.redirectUrl);
    const stateCookieValue = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const authUrl = this.deps.oauthManager.getAuthorizationUrl(providerUpper, stateData.state);

    return {
      authUrl,
      stateCookieValue,
      stateCookieMaxAgeMs: 15 * 60 * 1000,
    };
  }
}
