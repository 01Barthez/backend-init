import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/client';
import { AUTH_COOKIES } from '@/core/constants/app.constants';
import { MAIL } from '@/core/constants/mail.constants';
import jwtService from '@/services/auth/jwt.service';
import rbacService from '@/services/auth/rbac.service';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import { compare_password } from '@/utils/password/hash-password';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/set-safe-cookie';

const login = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password } = req.body;

  const validation = validateRequiredFields(req.body, ['email', 'password']);
  if (!validation.valid) {
    return response.badRequest(
      req,
      res,
      `Missing required field(s): ${validation.missing.join(', ')}`,
    );
  }

  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    return response.unauthorized(req, res, 'Invalid login credentials');
  }

  if (!user.isVerified) {
    return response.forbidden(req, res, 'Please verify your account first');
  }

  const isPasswordValid = await compare_password(password, user.password || '');
  if (!isPasswordValid) {
    return response.unauthorized(req, res, 'Invalid login credentials');
  }

  const { permissions, roles } = await rbacService.getUserAuthContext(user.id);
  const tokenPair = jwtService.issueTokenPair(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
    },
    permissions,
    roles,
  );

  await jwtService.persistRefreshToken(
    user.id,
    tokenPair.refreshToken,
    tokenPair.refreshJti,
    tokenPair.familyId,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true },
  });

  res.setHeader('authorization', `Bearer ${tokenPair.accessToken}`);
  setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, tokenPair.refreshToken, {
    secure: envs.COOKIE_SECURE as boolean,
    httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
    sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
  });

  const userFullName = `${user.lastName} ${user.firstName}`;
  queueMail({
    to: email,
    subject: MAIL.LOGIN_ALERT_SUBJECT,
    template: 'alert-login',
    data: { name: userFullName, date: new Date() },
  }).catch((error) => {
    log.warn('Failed to queue login alert email', { email, error: error.message });
  });

  return response.ok(
    req,
    res,
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileUrl: user.avatarUrl,
      roles,
      permissions,
    },
    'Login successful',
  );
});

export default login;
