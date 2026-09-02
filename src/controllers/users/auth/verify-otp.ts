import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

const verifyOtp = asyncHandler(
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

    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        otp: true,
      },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    if (user.isVerified) {
      return response.conflict(req, res, 'User already verified');
    }

    if (user.otp?.code !== otp) {
      return response.forbidden(req, res, 'Invalid OTP code');
    }

    const now = new Date();
    if (user.otp?.expireAt && user.otp.expireAt < now) {
      return response.forbidden(req, res, 'OTP has expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, emailVerifiedAt: now },
    });

    await invalidateUserCache(user.id, email);

    const userFullName = `${user.lastName} ${user.firstName}`;

    queueMail({
      to: email,
      subject: MAIL.WELCOME_SUBJECT,
      template: 'welcome',
      data: { name: userFullName },
    }).catch((error) => {
      log.warn('Failed to send welcome email', { email, error: error.message });
    });

    log.info('User verified successfully', { userId: user.id, email });

    return response.ok(req, res, { email }, 'Account verified successfully');
  },
);

export default verifyOtp;
