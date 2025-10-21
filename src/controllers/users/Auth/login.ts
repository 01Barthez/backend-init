import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { compare_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

import { getCachedUserByEmail } from '../_cache/user-cache';

//& Login
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

  // Get user from database (need password for verification)
  const user = await getCachedUserByEmail(email);

  if (!user) {
    return response.unauthorized(req, res, 'Invalid login credentials');
  }

  if (!user.is_verified) {
    return response.forbidden(req, res, 'Please verify your account first');
  }

  // Verify password
  const isPasswordValid = await compare_password(password, user.password || '');
  if (!isPasswordValid) {
    return response.unauthorized(req, res, 'Invalid login credentials');
  }

  user.password = '';
  user.otp = null;

  // Generate tokens
  const accessToken = userToken.accessToken(user);
  const refreshToken = userToken.refreshToken(user);

  await prisma.$transaction(async (tx) => {
    // Set cookies
    res.setHeader('authorization', `Bearer ${accessToken}`);
    setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    });
    log.info('Set authorization header and refresh token cookie', { email });

    // Update last login
    await tx.users.update({
      where: { user_id: user.user_id },
      data: { is_active: true },
    });
    log.info('User marked as active', { email: user.email });
  });

  // Send login alert email (non-blocking)
  const user_full_name = `${user.last_name} ${user.first_name}`;
  send_mail(email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
    name: user_full_name,
    date: new Date(),
  }).catch((error) => {
    log.warn('Failed to send login alert email', { email, error: error.message });
  });

  // Return response
  return response.ok(
    req,
    res,
    {
      id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      profile_url: user.avatar_url,
    },
    'Login successful',
  );
});

export default login;
