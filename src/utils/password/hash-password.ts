import bcrypt from 'bcrypt';

export const hash_password = async (plainText: string): Promise<string | undefined> => {
  try {
    const getRounds = 10;
    const salt = await bcrypt.genSalt(getRounds);
    const hashPassword = await bcrypt.hash(plainText, salt);

    return hashPassword;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error}`);
  }
};

export const compare_password = async (
  comparePlainText: string,
  compareHashPassword: string,
): Promise<boolean | undefined> => {
  try {
    const resultat = await bcrypt.compare(comparePlainText, compareHashPassword);
    return resultat;
  } catch (error) {
    throw new Error(`Failed to compare password: ${error}`);
  }
};
