import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/mail/send-mail.service';
import userToken from '@/services/jwt/jwt.service';
import log from '@/services/logging/logger';
import { compare_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

import { getCachedUserByEmail } from '../_cache/user-cache';

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

  const user = await getCachedUserByEmail(email);

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

  user.password = '';
  user.otp = null;

  const accessToken = userToken.accessToken(user);
  const refreshToken = userToken.refreshToken(user);

  await prisma.$transaction(async (tx) => {
    res.setHeader('authorization', `Bearer ${accessToken}`);
    setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    });
    log.info('Set authorization header and refresh token cookie', { email });

    await tx.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });
    log.info('User marked as active', { email: user.email });
  });

  const userFullName = `${user.lastName} ${user.firstName}`;
  send_mail(email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
    name: userFullName,
    date: new Date(),
  }).catch((error) => {
    log.warn('Failed to send login alert email', { email, error: error.message });
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
    },
    'Login successful',
  );
});

export default login;
