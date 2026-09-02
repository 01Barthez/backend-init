import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '@/core/interfaces/auth.interface';
import blacklistService from '@/services/auth/blacklist.service';
import jwtService from '@/services/auth/jwt.service';
import rbacService from '@/services/auth/rbac.service';
import log from '@/services/logging/logger';
import { AppError } from '@/utils/errors/app-error';
import { asyncHandler } from '@/utils/responses/helpers';

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required');
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
      throw AppError.unauthorized('Access token is required');
    }

    const decoded = jwtService.verifyAccessToken(accessToken);

    if (!decoded.jti || (await blacklistService.isRevoked(decoded.jti))) {
      throw AppError.unauthorized('Token has been revoked');
    }

    const authContext = await rbacService.getUserAuthContext(decoded.id);
    req.user = { ...decoded, permissions: authContext.permissions, roles: authContext.roles };

    next();
  },
);

export const requireVerified = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.isVerified) {
      throw AppError.forbidden('Account not verified');
    }
    next();
  },
);

export const requireActive = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.isActive) {
      throw AppError.forbidden('Account is inactive');
    }
    next();
  },
);

export const requirePermission = (permission: string) =>
  asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    const allowed = await rbacService.hasPermission(req.user.id, permission);
    if (!allowed) {
      log.warn('Permission denied', { userId: req.user.id, permission });
      throw AppError.forbidden(`Missing permission: ${permission}`);
    }

    next();
  });

export const requireAnyRole = (...roles: string[]) =>
  asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    const allowed = await rbacService.hasAnyRole(req.user.id, roles);
    if (!allowed) {
      throw AppError.forbidden('Insufficient role privileges');
    }

    next();
  });
