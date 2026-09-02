import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

/**
 * Hash a plaintext password with bcrypt.
 * Prefer this over storing or logging the raw value anywhere.
 */
export const hashPassword = async (plainText: string): Promise<string> => {
  try {
    return await bcrypt.hash(plainText, BCRYPT_ROUNDS);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to hash password: ${detail}`);
  }
};

/**
 * Constant-time compare of plaintext against a stored bcrypt hash.
 */
export const comparePassword = async (
  plainText: string,
  passwordHash: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainText, passwordHash);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to compare password: ${detail}`);
  }
};
