import { featureFlagService } from '@/shared/infrastructure/feature-flags';

import type { OAuthFeatureFlagPort } from '../../application/services/oauth-feature-flag.port';

/** Reads `enable_oauth` from Flagsmith with config defaults as fallback. */
export const oauthFeatureFlagAdapter: OAuthFeatureFlagPort = {
  async isOAuthEnabled(): Promise<boolean> {
    return featureFlagService.isEnabled('enable_oauth', true);
  },
};

export default oauthFeatureFlagAdapter;
