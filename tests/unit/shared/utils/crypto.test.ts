import { describe, expect, it } from 'vitest';

import {
  comparePassword,
  decryptSecret,
  encryptSecret,
  hashPassword,
  hashToken,
  randomHex,
} from '@/shared/utils/crypto';

describe('shared/utils/crypto', () => {
  it('hashPassword / comparePassword round-trip', async () => {
    const hash = await hashPassword('secret-pass');

    expect(hash).not.toBe('secret-pass');
    await expect(comparePassword('secret-pass', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong', hash)).resolves.toBe(false);
  });

  it('hashToken is deterministic SHA-256 hex', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toHaveLength(64);
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });

  it('randomHex returns hex of expected length', () => {
    expect(randomHex(16)).toMatch(/^[0-9a-f]{32}$/);
    expect(randomHex(32)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('randomHex rejects invalid byteLength', () => {
    expect(() => randomHex(0)).toThrow(/byteLength/);
  });

  it('encryptSecret / decryptSecret round-trip', () => {
    const key = 'a'.repeat(64);
    const boxed = encryptSecret('provider-token', key);
    expect(boxed.startsWith('enc:v1:')).toBe(true);
    expect(decryptSecret(boxed, key)).toBe('provider-token');
  });
});
