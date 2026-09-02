import { OAuthInvalidProviderError } from '../../domain/errors/oauth.errors';
import { OAuthProvider } from '../../domain/types/oauth.types';
import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { UnlinkInput } from '../dto/oauth.dto';

export type UnlinkCommandDeps = {
  oauthManager: OAuthManager;
};

/**
 * Unlinks an OAuth provider from the authenticated user.
 */
export class UnlinkCommand {
  constructor(private readonly deps: UnlinkCommandDeps) {}

  async execute(input: UnlinkInput): Promise<OAuthProvider> {
    const providerUpper = input.provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      throw new OAuthInvalidProviderError();
    }

    await this.deps.oauthManager.unlinkOAuthAccount(input.userId, providerUpper);
    return providerUpper;
  }
}
