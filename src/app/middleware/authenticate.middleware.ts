/**
 * JWT authentication + authorization helpers for Express.
 * Presentation-layer only — business rules stay in modules.
 */
import type { NextFunction, Response } from 'express';

import blacklistService from '@/modules/auth/infrastructure/providers/blacklist.provider';
import jwtService from '@/modules/auth/infrastructure/providers/jwt.service';
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.repository';
import type { AuthenticatedRequest } from '@/modules/auth/presentation/types/authenticated-request';
import rbacService from '@/modules/rbac';
import { permissionSatisfied } from '@/modules/rbac/domain/permission-match';
import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { setRequestContextUserId } from '@/shared/infrastructure/request-context';
import { asyncHandler } from '@/shared/utils/http/responses/helpers';

const accountDirectory = new PrismaUserRepository();

/**
 * Require a valid, non-revoked Bearer access token and attach `req.user`
 * with live account flags + RBAC (one user + one RBAC load per request).
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

    const [account, authContext] = await Promise.all([
      accountDirectory.findById(decoded.id),
      rbacService.getUserAuthContext(decoded.id),
    ]);

    if (!account) {
      throw AppError.unauthorized('User not found');
    }

    req.user = {
      ...decoded,
      isActive: account.isActive,
      isVerified: account.isVerified,
      permissions: authContext.permissions,
      roles: authContext.roles,
    };

    setRequestContextUserId(decoded.id);

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

    const roles = req.user.roles ?? [];
    const permissions = req.user.permissions ?? [];
    const allowed =
      roles.includes(SYSTEM_ROLES.SUPER_ADMIN) || permissionSatisfied(permissions, permission);

    if (!allowed) {
      log.warn('Permission denied', { userId: req.user.id, permission });
      throw AppError.forbidden(`Missing permission: ${permission}`);
    }

    next();
  });

export const requireAnyRole = (...roles: string[]) =>
  asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    const userRoles = req.user.roles ?? [];
    const allowed = roles.some((role) => userRoles.includes(role));
    if (!allowed) {
      throw AppError.forbidden('Insufficient role privileges');
    }

    next();
  });
