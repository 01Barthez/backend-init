import { hashToken, tokenHashesEqual } from '@/shared/utils/crypto';

/** Bind OTP to email so the hash is computable before the user id exists. */
export const hashOtpCode = (email: string, otp: string): string =>
  hashToken(`otp:${email.trim().toLowerCase()}:${otp}`);

export const otpMatches = (email: string, otp: string, storedHash: string): boolean =>
  tokenHashesEqual(storedHash, hashOtpCode(email, otp));
