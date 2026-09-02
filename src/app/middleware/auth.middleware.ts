/**
 * Role helpers built on top of `authenticate.middleware`.
 */
import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '@/modules/auth/presentation/types/authenticated-request';
import rbacService from '@/modules/rbac';
import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import { asyncHandler } from '@/shared/utils/http/responses/helpers';

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
