import type { NextFunction, Request, Response } from 'express';

import blackListToken from '@/services/jwt/black_list';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { response } from '@/utils/responses/helpers';

/**
 * Middleware to verify if user is authenticated
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract access token from request headers
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.warn('Authorization header is malformed');
      return response.unauthorized(req, res, 'Access token is required');
    }

    const accessToken = authHeader.replace('Bearer Bearer', 'Bearer').split(' ')[1] || '';

    if (!accessToken) {
      return response.unauthorized(req, res, 'Access token is required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await blackListToken.isBlackListToken(accessToken);
    if (isBlacklisted) {
      log.warn('Attempted access with blacklisted token');
      return response.unauthorized(req, res, 'Token has been revoked');
    }

    // Verify token validity
    const decoded = userToken.verifyAccessToken(accessToken);
    if (!decoded) {
      return response.unauthorized(req, res, 'Invalid access token');
    }

    // Attach user data to request object
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    log.error('Authentication error', { error: error.message, stack: error.stack });
    return response.unauthorized(req, res, 'Authentication failed');
  }
};

/**
 * Middleware to verify if user has admin role
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'admin') {
      log.warn('Access denied: User is not an admin', { userId: user.id, role: user.role });
      return response.forbidden(req, res, 'Access denied. Admin privileges required');
    }

    next();
  } catch (error: any) {
    log.error('Admin authorization error', { error: error.message });
    return response.forbidden(req, res, 'Authorization failed');
  }
};

/**
 * Middleware to check if user is verified
 */
export const isVerified = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    if (!user.is_verified) {
      return response.forbidden(req, res, 'Account not verified. Please verify your account first');
    }

    next();
  } catch (error: any) {
    log.error('Verification check error', { error: error.message });
    return response.forbidden(req, res, 'Verification check failed');
  }
};

/**
 * Middleware to check if user is active
 */
export const isActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    if (!user.is_active) {
      return response.forbidden(req, res, 'Account is inactive. Please contact support');
    }

    next();
  } catch (error: any) {
    log.error('Active check error', { error: error.message });
    return response.forbidden(req, res, 'Active check failed');
  }
};
