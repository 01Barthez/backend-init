import type { OAuthProvider as PrismaOAuthProvider } from '@prisma/client';

export { OAuthProvider } from '@prisma/client';

/**
 * OAuth domain types and provider port.
 * No Express / Prisma client usage beyond the provider enum.
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

export interface IOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface IOAuthUserProfile {
  provider: PrismaOAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified?: boolean;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatarUrl?: string;
  locale?: string;
  // Provider payloads vary; keep loose for Prisma Json + provider adapters.

  rawProfile: Record<string, any>;
}

export interface IOAuthAccountData {
  userId: string;
  provider: PrismaOAuthProvider;
  providerUserId: string;
  providerEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;

  providerProfileData?: Record<string, any>;
  linkedAt?: Date;
}

export interface IOAuthState {
  state: string;
  redirectUrl?: string;
  timestamp: number;
}

export interface IOAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * Port implemented by each OAuth2 provider adapter.
 */
export interface IOAuthService {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<IOAuthTokenResponse>;
  getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;
  refreshAccessToken?(refreshToken: string): Promise<IOAuthTokenResponse>;
}
