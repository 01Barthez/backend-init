import type { CreateUserInput, UpdateUserInput, UserEntity } from '../entities/user.entity';

/** Fields applied when claiming email verification (OTP race-safe activate). */
export type ClaimEmailVerificationData = {
  emailVerifiedAt: Date;
};

/**
 * Port for user persistence required by auth use cases.
 * Infrastructure provides a Prisma implementation.
 */
export interface UserRepositoryPort {
  findByEmail(email: string, options?: { includeDeleted?: boolean }): Promise<UserEntity | null>;

  findById(id: string, options?: { includeDeleted?: boolean }): Promise<UserEntity | null>;

  create(data: CreateUserInput): Promise<UserEntity>;

  update(id: string, data: UpdateUserInput): Promise<UserEntity>;

  /** Convenience: mark session active after successful login. */
  setActive(id: string, isActive: boolean): Promise<void>;

  /**
   * Atomically activate an unverified user (id + isVerified:false).
   * Returns false when another request already claimed verification.
   */
  claimEmailVerification(userId: string, data: ClaimEmailVerificationData): Promise<boolean>;

  /** Atomic OTP failure counter bump. */
  incrementOtpFailedAttempts(userId: string): Promise<void>;

  /**
   * Atomic login failure counter bump. Returns the new attempt count so the
   * caller can decide whether to set `lockedUntil`.
   */
  incrementFailedLoginAttempts(userId: string): Promise<number>;
}
