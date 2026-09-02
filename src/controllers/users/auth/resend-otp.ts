import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import generateOtp from '@/utils/otp/generate-otp';
import { getOtpExpirationDate } from '@/utils/otp/otp-expiration';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { getCachedUserByEmail, invalidateUserCache } from '../_cache/user-cache';

const resendOtp = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) {
      return response.badRequest(req, res, 'Email is required');
    }

    const user = await getCachedUserByEmail(email);

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    if (user.isVerified) {
      return response.conflict(req, res, 'User already verified');
    }

    const userOtp = generateOtp();
    const now = new Date();
    const otpExpireDate = getOtpExpirationDate(now);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: {
          code: userOtp,
          expireAt: otpExpireDate,
        },
      },
    });

    await invalidateUserCache(user.id, email);

    const userFullName = `${user.lastName} ${user.firstName}`;
    let emailSent = false;

    try {
      await queueMail({
        to: email,
        subject: MAIL.OTP_SUBJECT,
        template: 'otp',
        data: { date: now, name: userFullName, otp: userOtp },
      });
      emailSent = true;
      log.info('OTP resent successfully', { email });
    } catch (mailError: any) {
      log.error('Failed to resend OTP email', { email, error: mailError.message });
      return response.unprocessable(req, res, 'Failed to send OTP email');
    }

    return response.ok(req, res, { emailSent }, 'OTP resent successfully');
  },
);

export default resendOtp;
