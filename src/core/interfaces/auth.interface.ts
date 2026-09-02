import type { User } from '@prisma/client';
import type { Request } from 'express';

export type UserJwtPayload = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl' | 'isVerified' | 'isActive'
> & {
  jti?: string;
  familyId?: string;
  permissions?: string[];
  roles?: string[];
  iat?: number;
  exp?: number;
};

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
  familyId: string;
}
