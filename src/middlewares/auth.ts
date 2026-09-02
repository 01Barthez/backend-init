import type { NextFunction, Response } from 'express';

import { SYSTEM_ROLES } from '@/core/constants/app.constants';
import type { AuthenticatedRequest } from '@/core/interfaces/auth.interface';
import rbacService from '@/services/auth/rbac.service';
import { AppError } from '@/utils/errors/app-error';
import { asyncHandler } from '@/utils/responses/helpers';

export {
  authenticate,
  requireActive as isActive,
  authenticate as isAuthenticated,
  requireVerified as isVerified,
  requireActive,
  requireAnyRole,
  requirePermission,
  requireVerified,
} from './authenticate.middleware';

export const isAdmin = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    const allowed = await rbacService.hasAnyRole(req.user.id, [
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SUPER_ADMIN,
    ]);

    if (!allowed) {
      throw AppError.forbidden('Access denied. Admin privileges required');
    }

    next();
  },
);
