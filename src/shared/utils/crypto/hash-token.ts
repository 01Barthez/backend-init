import { createHash } from 'crypto';

/**
 * One-way SHA-256 fingerprint for opaque secrets (refresh tokens, JWTs at rest).
 * Never store the raw token in the database — store this hash instead.
 */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
