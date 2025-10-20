import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { getCachedUserByEmail, invalidateUserCache } from '../_cache/user-cache';

//& Verify Account (OTP)
const verify_otp = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, otp } = req.body;

    const validation = validateRequiredFields(req.body, ['email', 'otp']);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    // Get user from database (bypass cache for OTP verification)
    const user = await getCachedUserByEmail(email);

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    if (user.is_verified) {
      return response.conflict(req, res, 'User already verified');
    }

    // Check OTP validity
    if (user.otp?.code !== otp) {
      return response.forbidden(req, res, 'Invalid OTP code');
    }

    // Check OTP expiration
    const now = new Date();
    if (user.otp?.expire_at && user.otp.expire_at < now) {
      return response.forbidden(req, res, 'OTP has expired');
    }

    // Verify user
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { is_verified: true, otp: null, email_verified_at: now },
    });

    // Invalidate cache
    await invalidateUserCache(user.user_id, email);

    // Send welcome email (non-blocking)
    const user_full_name = `${user.last_name} ${user.first_name}`;

    send_mail(email, MAIL.WELCOME_SUBJECT, 'welcome', {
      name: user_full_name,
    }).catch((error) => {
      log.warn('Failed to send welcome email', { email, error: error.message });
    });

    log.info('User verified successfully', { userId: user.user_id, email });

    return response.ok(req, res, { email }, 'Account verified successfully');
  },
);

export default verify_otp;
