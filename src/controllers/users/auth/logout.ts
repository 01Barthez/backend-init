import { TokenFamily } from '@prisma/client';
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/client';
import blacklistService from '@/services/auth/blacklist.service';
import jwtService from '@/services/auth/jwt.service';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

const logout = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const user = (req as any).user;

  if (!user) {
    return response.unauthorized(req, res, 'User not authenticated');
  }

  const refreshCookieName = jwtService.getRefreshCookieName();
  const refreshToken = req.cookies?.[refreshCookieName];

  if (refreshToken) {
    try {
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      await blacklistService.revokeToken({
        jti: decoded.jti,
        token: refreshToken,
        family: TokenFamily.REFRESH,
        userId: user.id,
        expireAt: new Date(decoded.exp! * 1000),
      });
    } catch (error: any) {
      log.warn('Failed to revoke refresh token on logout', { error: error.message });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });

  res.removeHeader('authorization');
  res.clearCookie(refreshCookieName, {
    secure: envs.COOKIE_SECURE as boolean,
    httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
    sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
  });

  log.info('User logged out successfully', { userId: user.id });

  return response.ok(req, res, null, 'Logout successful');
});

export default logout;
