/**
 * Plain auth-facing user entity.
 * No Prisma / ORM types — infrastructure maps to and from this shape.
 */
export type UserOtp = {
  code: string;
  expireAt: Date;
};

export type UserEntity = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Stored bcrypt hash; never expose in API serializers. */
  passwordHash?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  otp?: UserOtp | null;
  emailVerifiedAt?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  otpFailedAttempts?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl?: string;
  otp: UserOtp;
};

export type UpdateUserInput = Partial<{
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  otp: UserOtp | null;
  emailVerifiedAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  otpFailedAttempts: number;
  lastLoginAt: Date | null;
  lastPasswordChange: Date | null;
}>;
