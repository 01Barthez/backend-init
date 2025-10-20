/**
 * OAuth2.0 Types and Interfaces
 * Defines all types for OAuth2.0 authentication flow
 */

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  TELEGRAM = 'TELEGRAM',
}

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
 * OAuth Token Response from Provider
 */
export interface IOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string; // For OpenID Connect (Google)
}

/**
 * Normalized OAuth User Profile
 */
export interface IOAuthUserProfile {
  provider: OAuthProvider;
  provider_user_id: string;
  email: string;
  email_verified?: boolean;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
  locale?: string;
  raw_profile: Record<string, any>;
}

/**
 * OAuth Account Data for Database
 */
export interface IOAuthAccountData {
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  provider_email?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
  provider_profile_data?: Record<string, any>;
}

/**
 * OAuth State Parameter (for CSRF protection)
 */
export interface IOAuthState {
  state: string;
  redirect_url?: string;
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
