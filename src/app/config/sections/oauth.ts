/**
 * OAuth 2.0 provider credentials.
 * Empty client IDs disable the corresponding provider at runtime.
 */
import { envHelpers, fromEnv } from '../env';

const defaultCallback = (provider: string) =>
  envHelpers.oauthCallback(`/api/v1/auth/oauth/${provider}/callback`);

export const oauthConfig = {
  google: {
    clientId: fromEnv.get('GOOGLE_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('GOOGLE_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv.get('GOOGLE_REDIRECT_URI').default(defaultCallback('google')).asString(),
  },
  github: {
    clientId: fromEnv.get('GITHUB_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('GITHUB_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv.get('GITHUB_REDIRECT_URI').default(defaultCallback('github')).asString(),
  },
  facebook: {
    clientId: fromEnv.get('FACEBOOK_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('FACEBOOK_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv
      .get('FACEBOOK_REDIRECT_URI')
      .default(defaultCallback('facebook'))
      .asString(),
  },
  instagram: {
    clientId: fromEnv.get('INSTAGRAM_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('INSTAGRAM_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv
      .get('INSTAGRAM_REDIRECT_URI')
      .default(defaultCallback('instagram'))
      .asString(),
  },
  twitter: {
    clientId: fromEnv.get('TWITTER_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('TWITTER_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv.get('TWITTER_REDIRECT_URI').default(defaultCallback('twitter')).asString(),
  },
  linkedin: {
    clientId: fromEnv.get('LINKEDIN_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('LINKEDIN_CLIENT_SECRET').default('').asString(),
    redirectUri: fromEnv
      .get('LINKEDIN_REDIRECT_URI')
      .default(defaultCallback('linkedin'))
      .asString(),
  },
  telegram: {
    botToken: fromEnv.get('TELEGRAM_BOT_TOKEN').default('').asString(),
    botUsername: fromEnv.get('TELEGRAM_BOT_USERNAME').default('').asString(),
  },
} as const;

export type OAuthConfig = typeof oauthConfig;
