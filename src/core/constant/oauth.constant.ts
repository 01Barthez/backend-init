/**
 * OAuth2.0 Constants
 * Contains all OAuth provider URLs and configuration constants
 */
import { OAuthProvider } from '../interface/oauth.interface';

/**
 * OAuth Provider URLs
 */
export const OAUTH_URLS = {
  [OAuthProvider.GOOGLE]: {
    AUTHORIZATION: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN: 'https://oauth2.googleapis.com/token',
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
    REVOKE: 'https://oauth2.googleapis.com/revoke',
  },
  [OAuthProvider.GITHUB]: {
    AUTHORIZATION: 'https://github.com/login/oauth/authorize',
    TOKEN: 'https://github.com/login/oauth/access_token',
    USER_INFO: 'https://api.github.com/user',
    USER_EMAILS: 'https://api.github.com/user/emails',
  },
  [OAuthProvider.FACEBOOK]: {
    AUTHORIZATION: 'https://www.facebook.com/v18.0/dialog/oauth',
    TOKEN: 'https://graph.facebook.com/v18.0/oauth/access_token',
    USER_INFO: 'https://graph.facebook.com/v18.0/me',
  },
  [OAuthProvider.INSTAGRAM]: {
    AUTHORIZATION: 'https://api.instagram.com/oauth/authorize',
    TOKEN: 'https://api.instagram.com/oauth/access_token',
    USER_INFO: 'https://graph.instagram.com/me',
  },
  [OAuthProvider.TWITTER]: {
    AUTHORIZATION: 'https://twitter.com/i/oauth2/authorize',
    TOKEN: 'https://api.twitter.com/2/oauth2/token',
    USER_INFO: 'https://api.twitter.com/2/users/me',
    REVOKE: 'https://api.twitter.com/2/oauth2/revoke',
  },
  [OAuthProvider.LINKEDIN]: {
    AUTHORIZATION: 'https://www.linkedin.com/oauth/v2/authorization',
    TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken',
    USER_INFO: 'https://api.linkedin.com/v2/userinfo',
  },
  [OAuthProvider.TELEGRAM]: {
    AUTHORIZATION: 'https://oauth.telegram.org/auth',
    USER_INFO: 'https://api.telegram.org/bot',
  },
} as const;

/**
 * Default OAuth Scopes per Provider
 */
export const OAUTH_SCOPES = {
  [OAuthProvider.GOOGLE]: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  [OAuthProvider.GITHUB]: ['read:user', 'user:email'],
  [OAuthProvider.FACEBOOK]: ['email', 'public_profile'],
  [OAuthProvider.INSTAGRAM]: ['user_profile', 'user_media'],
  [OAuthProvider.TWITTER]: ['tweet.read', 'users.read', 'offline.access'],
  [OAuthProvider.LINKEDIN]: ['openid', 'profile', 'email'],
  [OAuthProvider.TELEGRAM]: ['read'],
} as const;

/**
 * OAuth Error Messages
 */
export const OAUTH_ERRORS = {
  INVALID_STATE: 'Invalid OAuth state parameter',
  MISSING_CODE: 'Authorization code not provided',
  TOKEN_EXCHANGE_FAILED: 'Failed to exchange authorization code for token',
  USER_INFO_FAILED: 'Failed to fetch user information from provider',
  ACCOUNT_LINKING_FAILED: 'Failed to link OAuth account',
  PROVIDER_NOT_CONFIGURED: 'OAuth provider is not configured',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  ACCOUNT_NOT_FOUND: 'OAuth account not found',
  INVALID_PROVIDER: 'Invalid OAuth provider',
} as const;

/**
 * OAuth State TTL (15 minutes)
 */
export const OAUTH_STATE_TTL = 15 * 60 * 1000;

/**
 * OAuth Cookie Names
 */
export const OAUTH_COOKIES = {
  STATE: 'oauth_state',
  REDIRECT: 'oauth_redirect',
} as const;
