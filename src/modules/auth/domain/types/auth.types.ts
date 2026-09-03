/**
 * JWT / token types used across auth use cases.
 * Keep Express Request types out of domain — see presentation layer for AuthenticatedRequest.
 */

export type UserJwtPayload = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  jti?: string;
  familyId?: string;
  permissions?: string[];
  roles?: string[];
  iat?: number;
  exp?: number;
  type?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
  familyId: string;
};

/** Domain-level token family labels (mirrors Prisma TokenFamily without importing it). */
export type AuthTokenFamily = 'ACCESS' | 'REFRESH' | 'PASSWORD_RESET' | 'EMAIL_VERIFY';

/** Domain-level revoke reasons (mirrors Prisma RevokeReason without importing it). */
export type AuthRevokeReason =
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ADMIN_REVOKE'
  | 'TOKEN_ROTATION'
  | 'REUSE_DETECTED'
  | 'SECURITY_EVENT';

export type StoredRefreshToken = {
  id: string;
  userId: string;
  jti: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  replacedBy?: string | null;
  expiresAt: Date;
  lastUsedAt?: Date | null;
};

/** One refresh-token family as shown on GET /auth/sessions. */
export type AuthSessionSummary = {
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  isRevoked: boolean;
};
