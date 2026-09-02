import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto';

const PREFIX = 'enc:v1';

const keyFromMaterial = (keyMaterial: string): Buffer => {
  const trimmed = keyMaterial.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  return scryptSync(trimmed, 'backend-init-secret-box', 32);
};

/**
 * AES-256-GCM box for short secrets (OAuth provider tokens at rest).
 * Payload format: `enc:v1:<ivHex>:<tagHex>:<cipherHex>`.
 */
export const encryptSecret = (plainText: string, keyMaterial: string): string => {
  if (!plainText) return '';
  if (!keyMaterial?.trim()) {
    throw new Error('Encryption key is required to store secrets at rest');
  }

  const key = keyFromMaterial(keyMaterial);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptSecret = (payload: string, keyMaterial: string): string => {
  if (!payload) return '';
  if (!payload.startsWith(`${PREFIX}:`)) {
    // Legacy plaintext rows — do not fail reads during rollout.
    return payload;
  }
  if (!keyMaterial?.trim()) {
    throw new Error('Encryption key is required to read secrets at rest');
  }

  const [, , ivHex, tagHex, dataHex] = payload.split(':');
  const key = keyFromMaterial(keyMaterial);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};

/** Fingerprint a key without exposing it (ops / logs). */
export const encryptionKeyFingerprint = (keyMaterial: string): string =>
  createHash('sha256').update(keyMaterial).digest('hex').slice(0, 8);
