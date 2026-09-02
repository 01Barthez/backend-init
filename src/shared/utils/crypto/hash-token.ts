import { createHash, timingSafeEqual } from 'crypto';

/**
 * One-way SHA-256 fingerprint for opaque secrets (refresh tokens, reset tokens).
 * Never store the raw token in the database — store this hash instead.
 */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Constant-time compare of two hashes. Length mismatch is always false. */
export const tokenHashesEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};
