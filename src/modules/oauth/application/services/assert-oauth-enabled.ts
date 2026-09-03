import { OAuthFeatureDisabledError } from '../../domain/errors/oauth.errors';
import type { OAuthFeatureFlagPort } from './oauth-feature-flag.port';

/** Fail closed when Flagsmith `enable_oauth` is off. */
export const assertOAuthEnabled = async (flags?: OAuthFeatureFlagPort): Promise<void> => {
  const enabled = await (flags?.isOAuthEnabled() ?? Promise.resolve(true));
  if (!enabled) {
    throw new OAuthFeatureDisabledError();
  }
};
