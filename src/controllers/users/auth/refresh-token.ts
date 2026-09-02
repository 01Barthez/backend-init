import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { AUTH_COOKIES } from '@/core/constants/app.constants';
import jwtService from '@/services/auth/jwt.service';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/set-safe-cookie';

const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const cookieName = envs.REFRESH_TOKEN_COOKIE || jwtService.getRefreshCookieName();
    const token = req.cookies?.[cookieName] ?? req.body?.refreshToken;

    if (!token) {
      return response.unauthorized(req, res, 'Refresh token is required');
    }

    try {
      const pair = await jwtService.rotateRefreshToken(token);

      res.setHeader('authorization', `Bearer ${pair.accessToken}`);
      setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, pair.refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      return response.ok(req, res, { accessToken: pair.accessToken }, 'Token refreshed');
    } catch (error: any) {
      log.warn('Refresh token rotation failed', { error: error.message });
      return response.unauthorized(req, res, 'Invalid or expired refresh token');
    }
  },
);

export default refreshToken;
