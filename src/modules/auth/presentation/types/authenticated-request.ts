import type { Request } from 'express';

import type { UserJwtPayload } from '../../domain/types/auth.types';

/**
 * Express-specific authenticated request — kept out of domain.
 */
export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
}
