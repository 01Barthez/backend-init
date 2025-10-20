import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { get_expire_date } from '@/utils/Otp/OTPExpirationDate';
import generate_otp from '@/utils/Otp/generateOtp';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { getCachedUserByEmail, invalidateUserCache } from '../_cache/user-cache';

//& Resend OTP
const resend_otp = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) {
      return response.badRequest(req, res, 'Email is required');
    }

    const user = await getCachedUserByEmail(email);

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    if (user.is_verified) {
      return response.conflict(req, res, 'User already verified');
    }

    // Generate new OTP
    const user_otp = generate_otp() || '000000';
    const now = new Date();
    const otp_expire_date = get_expire_date(now);

    // Update user with new OTP
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });

    // Invalidate cache
    await invalidateUserCache(user.user_id, email);

    // Send OTP email
    const user_full_name = `${user.last_name} ${user.first_name}`;
    let emailSent = false;

    try {
      await send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
        date: now,
        name: user_full_name,
        otp: user_otp,
      });
      emailSent = true;
      log.info('OTP resent successfully', { email });
    } catch (mailError: any) {
      log.error('Failed to resend OTP email', { email, error: mailError.message });
      return response.unprocessable(req, res, 'Failed to send OTP email');
    }

    return response.ok(req, res, { email_sent: emailSent }, 'OTP resent successfully');
  },
);

export default resend_otp;
