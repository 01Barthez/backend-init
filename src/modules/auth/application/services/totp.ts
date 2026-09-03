/**
 * TOTP helpers (otplib v13). Secrets are stored encrypted via AUTH_ENCRYPTION_KEY.
 */
import { generateSecret, generateURI, verifySync } from 'otplib';

import { config } from '@/app/config';
import { decryptSecret, encryptSecret } from '@/shared/utils/crypto';

export const createTotpSecret = (): string => generateSecret();

export const buildTotpUri = (email: string, secret: string): string =>
  generateURI({
    issuer: config.app.name,
    label: email,
    secret,
  });

export const isValidTotpCode = (secret: string, token: string): boolean => {
  const result = verifySync({ secret, token });
  return result.valid === true;
};

export const encryptTotpSecret = (plainSecret: string): string => {
  const key = config.auth.encryptionKey;
  if (!key.trim()) {
    throw new Error('AUTH_ENCRYPTION_KEY is required to store TOTP secrets');
  }
  return encryptSecret(plainSecret, key);
};

export const decryptTotpSecret = (ciphertext: string): string => {
  const key = config.auth.encryptionKey;
  if (!key.trim()) {
    throw new Error('AUTH_ENCRYPTION_KEY is required to read TOTP secrets');
  }
  return decryptSecret(ciphertext, key);
};
