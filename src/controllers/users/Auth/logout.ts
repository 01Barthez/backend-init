import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import blackListAccessAndRefresToken from '@/services/jwt/black_list_access_&_refresh_tokens';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Logout
const logout = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const user = (req as any).user;

  if (!user) {
    return response.unauthorized(req, res, 'User not authenticated');
  }

  // Update user status to active
  await prisma.users.update({
    where: { user_id: user.user_id },
    data: { is_active: false },
  });

  // Blacklist tokens
  await blackListAccessAndRefresToken(req, res);

  // Clear cookies
  res.removeHeader('authorization');
  res.clearCookie(envs.JWT_SECRET, {
    secure: envs.COOKIE_SECURE as boolean,
    httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
    sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
  });

  log.info('User logged out successfully', { userId: user.user_id });

  return response.ok(req, res, null, 'Logout successful');
});

export default logout;
