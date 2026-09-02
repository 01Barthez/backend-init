/**
 * Authentication & token configuration.
 * Key paths point to RSA material used for RS256 JWT signing.
 * In production, mount keys via secrets — never bake them into the image.
 */
import { fromEnv } from '../env';

export const authConfig = {
  jwt: {
    secret: fromEnv.get('JWT_SECRET').default('jwt_refresh_key').asString(),
    algorithm: fromEnv.get('JWT_ALGORITHM').default('RS256').asString(),
    accessExpiresIn: fromEnv.get('JWT_ACCESS_EXPIRES_IN').default('15m').asString(),
    refreshExpiresIn: fromEnv.get('JWT_REFRESH_EXPIRES_IN').default('7d').asString(),
    /** Legacy alias kept for compatibility with older deployments. */
    expiresIn: fromEnv.get('JWT_EXPIRES_IN').default('1h').asString(),

    privateKeyPath: fromEnv
      .get('JWT_PRIVATE_KEY_PATH')
      .default('src/app/config/keys/private.key')
      .asString(),
    publicKeyPath: fromEnv
      .get('JWT_PUBLIC_KEY_PATH')
      .default('src/app/config/keys/public.key')
      .asString(),
    refreshPrivateKeyPath: fromEnv
      .get('JWT_REFRESH_PRIVATE_KEY_PATH')
      .default('src/app/config/keys/refreshPrivate.key')
      .asString(),
    refreshPublicKeyPath: fromEnv
      .get('JWT_REFRESH_PUBLIC_KEY_PATH')
      .default('src/app/config/keys/refreshPublic.key')
      .asString(),
  },

  cookies: {
    refreshTokenName: fromEnv.get('REFRESH_TOKEN_COOKIE').default('refresh_token').asString(),
    secure: fromEnv.get('JWT_COOKIE_SECURITY').default('true').asBool(),
    httpOnly: fromEnv.get('JWT_COOKIE_HTTP_STATUS').default('true').asBool(),
  },

  /** OTP validity window in milliseconds. */
  otpDelayMs: fromEnv.get('OTP_DELAY').default(900000).asInt(),
} as const;

export type AuthConfig = typeof authConfig;
