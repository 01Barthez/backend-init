import type { AuditPort } from '@/shared/infrastructure/audit';

import { OAuthInvalidProviderError } from '../../domain/errors/oauth.errors';
import { OAuthProvider } from '../../domain/types/oauth.types';
import type { OAuthManager } from '../../infrastructure/manager/oauth-manager.service';
import type { UnlinkInput } from '../dto/oauth.dto';
import { assertOAuthEnabled } from '../services/assert-oauth-enabled';
import type { OAuthFeatureFlagPort } from '../services/oauth-feature-flag.port';

export type UnlinkCommandDeps = {
  oauthManager: OAuthManager;
  audit?: AuditPort;
  featureFlags?: OAuthFeatureFlagPort;
};

/**
 * Unlinks an OAuth provider from the authenticated user.
 */
export class UnlinkCommand {
  constructor(private readonly deps: UnlinkCommandDeps) {}

  async execute(input: UnlinkInput): Promise<OAuthProvider> {
    await assertOAuthEnabled(this.deps.featureFlags);

    const providerUpper = input.provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      throw new OAuthInvalidProviderError();
    }

    await this.deps.oauthManager.unlinkOAuthAccount(input.userId, providerUpper);

    await this.deps.audit?.record({
      actorId: input.userId,
      action: 'oauth.unlink',
      resource: 'oauth_account',
      metadata: { provider: providerUpper },
    });

    return providerUpper;
  }
}
