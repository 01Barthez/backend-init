/**
 * JWT authentication + authorization helpers for Express.
 * Presentation-layer only — business rules stay in modules.
 */
import type { NextFunction, Response } from 'express';

import blacklistService from '@/modules/auth/infrastructure/providers/blacklist.provider';
import jwtService from '@/modules/auth/infrastructure/providers/jwt.service';
import type { AuthenticatedRequest } from '@/modules/auth/presentation/types/authenticated-request';
import rbacService from '@/modules/rbac';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { asyncHandler } from '@/shared/utils/http/responses/helpers';

/**
 * Require a valid, non-revoked Bearer access token and attach `req.user`.
 */
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
