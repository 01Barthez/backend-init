import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import blacklistTokens from '@/services/jwt/blacklist-tokens';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

const logout = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const user = (req as any).user;

  if (!user) {
    return response.unauthorized(req, res, 'User not authenticated');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });

  await blacklistTokens(req, res);

  res.removeHeader('authorization');
  res.clearCookie(envs.JWT_SECRET, {
    secure: envs.COOKIE_SECURE as boolean,
    httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
    sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
  });

  log.info('User logged out successfully', { userId: user.id });

  return response.ok(req, res, null, 'Logout successful');
});

export default logout;
