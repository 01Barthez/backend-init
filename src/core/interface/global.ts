import type { User } from '@prisma/client';

export type UserJwtPayload = User & { iat?: number; exp?: number };

export interface CustomRequest extends Request {
  user?: User | UserJwtPayload;
}
