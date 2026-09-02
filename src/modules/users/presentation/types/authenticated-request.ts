import type { Request } from 'express';

import type { UserJwtPayload } from '@/modules/auth';

/**
 * Express-specific authenticated request — kept out of domain.
 */
export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
}
