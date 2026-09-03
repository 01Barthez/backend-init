import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Valid bcrypt hash used only to equalize login timing when the email is unknown.
 * The compare result is discarded — never treat it as a successful login.
 */
export const DUMMY_PASSWORD_HASH = '$2b$12$npDp9EBaAgXjJSV6mkXJ9OY73/SSu6WBHvGwXS3UULtuzgVvZ5hRq';

/**
 * Hash a plaintext password with bcrypt (12 rounds).
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
 * Compare plaintext against a stored bcrypt hash.
 * Empty hashes return false (OAuth-only accounts cannot password-login).
 */
export const comparePassword = async (
  plainText: string,
  passwordHash: string,
): Promise<boolean> => {
  if (!passwordHash) return false;
  try {
    return await bcrypt.compare(plainText, passwordHash);
  } catch {
    return false;
  }
};
