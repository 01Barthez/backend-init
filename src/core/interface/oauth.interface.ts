/**
 * OAuth2.0 Types and Interfaces
 * Defines all types for OAuth2.0 authentication flow
 */

export { OAuthProvider } from '@prisma/client';

import type { OAuthProvider } from '@prisma/client';

/**
 * OAuth Provider Configuration
 */
export interface IOAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: readonly string[];
}

/**
 * OAuth Token Response from Provider (external API format)
 */
export interface IOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * Normalized OAuth User Profile
 */
export interface IOAuthUserProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified?: boolean;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatarUrl?: string;
  locale?: string;
  rawProfile: Record<string, any>;
}

/**
 * OAuth Account Data for Database
 */
export interface IOAuthAccountData {
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;
  providerProfileData?: Record<string, any>;
}

/**
 * OAuth State Parameter (for CSRF protection)
 */
export interface IOAuthState {
  state: string;
  redirectUrl?: string;
  timestamp: number;
}

/**
 * OAuth Callback Query Parameters
 */
export interface IOAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth Service Interface
 */
export interface IOAuthService {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<IOAuthTokenResponse>;
  getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;
  refreshAccessToken?(refreshToken: string): Promise<IOAuthTokenResponse>;
}
