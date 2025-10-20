import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { get_expire_date } from '@/utils/Otp/OTPExpirationDate';
import generate_otp from '@/utils/Otp/generateOtp';
import { hash_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { uploadAvatar } from '../_utils/avatarUploader';

//& Inscription (Sign up)
const signup = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password, first_name, last_name, phone, role } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(req.body, [
    'email',
    'password',
    'first_name',
    'last_name',
    'phone',
  ]);

  if (!validation.valid) {
    return response.badRequest(
      req,
      res,
      `Missing required field(s): ${validation.missing.join(', ')}`,
    );
  }

  // Check if email already exists (use cache for performance)
  const existingUser = await prisma.users.findFirst({
    where: { email, is_deleted: false },
  });

  if (existingUser) {
    return response.conflict(req, res, 'Email already exists');
  }

  // Upload avatar if provided
  const profile_url = await uploadAvatar(req.file);

  // Hash password
  const hashedPassword = await hash_password(password);

  // Generate OTP
  const user_otp = generate_otp();
  const now = new Date();
  const otp_expire_date = get_expire_date(now);

  // Create user
  const newUser = await prisma.users.create({
    data: {
      email,
      password: hashedPassword || '',
      first_name,
      last_name,
      phone,
      avatar_url: profile_url,
      role,
      otp: {
        code: user_otp || '000000',
        expire_at: otp_expire_date,
      },
    },
  });
  if (!newUser) return response.badRequest(req, res, 'failed to create user');

  // Send OTP email (non-blocking)
  const user_full_name = `${last_name} ${first_name}`;
  let emailSent = false;

  send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
    date: now,
    name: user_full_name,
    otp: user_otp,
  })
    .then(() => {
      emailSent = true;
      log.info('OTP email sent successfully', { email });
    })
    .catch((mailError: any) => {
      log.warn('Failed to send OTP email, but user was created successfully', {
        email,
        error: mailError.message,
      });
    });

  log.info('User created successfully', { email });

  return response.created(
    req,
    res,
    {
      email,
      first_name,
      last_name,
      phone,
      profile_url,
      otp: {
        otp_expire_date,
      },
      email_sent: emailSent,
    },
    'User created successfully',
  );
});

export default signup;
