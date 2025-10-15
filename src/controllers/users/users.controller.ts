import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { uploader } from '@/config/minio/minio';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { get_expire_date } from '@/utils/Otp/OTPExpirationDate';
import generate_otp from '@/utils/Otp/generateOtp';
import { hash_password } from '@/utils/password/hashPassword';
import { response } from '@/utils/responses/helpers';

// Object to regroups all our controllers
const users_controller = {
  //* AUTH SETUP **********************************************************************************************************************************************************
  // Insciption (Sign up)
  signup: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check all information are provided
    const missingFields = [];

    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!first_name) missingFields.push('first name');
    if (!last_name) missingFields.push('last name');
    if (!phone) missingFields.push('phone');

    if (missingFields.length > 0) {
      const errorMessage = `missing field(s) : ${missingFields.join(', ')}`;
      return response.badRequest(req, res, errorMessage);
    }

    // make sure email is unique
    const emailAlreadyExist = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    if (emailAlreadyExist) return response.conflict(req, res, 'Email already exist !');

    // Upload image to storage and save image
    let profile_url = '';

    if (req.file) {
      try {
        const profile = await uploader.uploadBuffer(
          req.file.buffer,
          {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
          },
          // { profile: 'avatar', prefix: 'profils', datePartition: true },
        );

        if (profile?.key) {
          // fetch the url of the storage file only if upload was successful
          profile_url = `http${envs.MINIO_USE_SSL ? 's' : ''}://localhost${[80, 443].includes(Number(envs.MINIO_PORT)) ? '' : `:${envs.MINIO_PORT}`}/${envs.MINIO_APP_BUCKET}/${profile.key}`;
        }
      } catch (err: any) {
        return response.unprocessable(req, res, `Failed to upload avatar: ${err}`);
      }
    } else {
      log.info("profile picture isn't defined !");
    }

    // hash password
    const user_password = (await hash_password(password)) || '';

    // Generate Otp
    const user_otp = generate_otp() || '';
    const now = new Date();
    const otp_expire_date = get_expire_date(now);

    // Process to user creation
    const create_employee = await prisma.users.create({
      data: {
        email,
        password: user_password,
        first_name,
        last_name,
        phone,
        avatar_url: profile_url,
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });
    if (!create_employee) return response.unprocessable(req, res, 'failed to create user !');

    // Mail to send OTP email to the user
    const user_full_name = last_name + ' ' + first_name;

    // await send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
    //   date: now,
    //   name: user_full_name,
    //   otp: user_otp,
    // });

    const user_data = {
      email,
      first_name,
      last_name,
      phone,
      profile_url,
      otp: {
        user_otp,
        otp_expire_date,
      },
    };

    response.created(req, res, user_data, 'user_successfully creadted');
  },

  // Connexion (Login)

  // Verify Account (OTP)

  // Deconnexion Logout

  // Forgot Password

  //* USER MANAGEMENT **********************************************************************************************************************************************************

  // 2FA

  // Login History

  // Active Sessions

  // Audit Logs

  //* ADMIN MANAGEMENT **********************************************************************************************************************************************************

  // List all Users: filter by : is_active, is_verified, is_deleted

  // Toggle User Status

  // Admin Delete User

  // Search User: search by: email, téléphone, nom

  // Export Users: export as CSV/Excel
};

export default users_controller;
