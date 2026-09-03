/**
 * Feature-flag port for OAuth — keeps Flagsmith out of command constructors in tests.
 */
export interface OAuthFeatureFlagPort {
  isOAuthEnabled(): Promise<boolean>;
}
