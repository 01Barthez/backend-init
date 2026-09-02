import { randomBytes } from 'crypto';

/**
 * Cryptographically secure random hex string.
 * `byteLength` is the entropy size in bytes (output length = byteLength * 2).
 */
export const randomHex = (byteLength: number): string => {
  if (!Number.isInteger(byteLength) || byteLength < 1) {
    throw new Error('randomHex: byteLength must be a positive integer');
  }
  return randomBytes(byteLength).toString('hex');
};
