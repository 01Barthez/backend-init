/**
 * Authentication & token configuration.
 * Key paths point to RSA material used for RS256 JWT signing.
 * Generate with `npm run keys:generate`. Never bake keys into the image.
 */
import { fromEnv } from '../env';
import { parseDurationMs } from '../parse-duration';

export const authConfig = {
  jwt: {
    algorithm: fromEnv.get('JWT_ALGORITHM').default('RS256').asString(),
    accessExpiresIn: fromEnv.get('JWT_ACCESS_EXPIRES_IN').default('15m').asString(),
    refreshExpiresIn: fromEnv.get('JWT_REFRESH_EXPIRES_IN').default('7d').asString(),
    /** Legacy alias kept for compatibility with older deployments. */
    expiresIn: fromEnv.get('JWT_EXPIRES_IN').default('1h').asString(),
    passwordResetExpiresInMs: parseDurationMs(
      fromEnv.get('PASSWORD_RESET_EXPIRES_IN').default('1h').asString(),
      3_600_000,
    ),

    privateKeyPath: fromEnv
      .get('JWT_PRIVATE_KEY_PATH')
      .default('keys/jwt-access-private.pem')
      .asString(),
    publicKeyPath: fromEnv
      .get('JWT_PUBLIC_KEY_PATH')
      .default('keys/jwt-access-public.pem')
      .asString(),
    refreshPrivateKeyPath: fromEnv
      .get('JWT_REFRESH_PRIVATE_KEY_PATH')
      .default('keys/jwt-refresh-private.pem')
      .asString(),
    refreshPublicKeyPath: fromEnv
      .get('JWT_REFRESH_PUBLIC_KEY_PATH')
      .default('keys/jwt-refresh-public.pem')
      .asString(),
  },

  cookies: {
    refreshTokenName: fromEnv.get('REFRESH_TOKEN_COOKIE').default('refresh_token').asString(),
    secure: fromEnv.get('JWT_COOKIE_SECURITY').default('true').asBool(),
    httpOnly: fromEnv.get('JWT_COOKIE_HTTP_STATUS').default('true').asBool(),
  },

  /** OTP validity window in milliseconds. */
  otpDelayMs: fromEnv.get('OTP_DELAY').default(900000).asInt(),

  /**
   * AES-256-GCM key for OAuth provider tokens and TOTP secrets at rest.
   * 64-char hex or any passphrase (scrypt). Empty = secrets are not stored.
   */
  encryptionKey: fromEnv.get('AUTH_ENCRYPTION_KEY').default('').asString(),
} as const;

export type AuthConfig = typeof authConfig;
