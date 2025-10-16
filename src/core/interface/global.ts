import type { users } from '@prisma/client';

export type IusersJwt = users & { iat?: number; exp?: number };
export interface customRequest extends Request {
  users?: users | IusersJwt;
}
