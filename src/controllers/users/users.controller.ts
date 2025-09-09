import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { uploader } from '@/config/minio/minio';
import prisma from '@/config/prisma/prisma';
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
    if (!email || !password || !first_name || !last_name || !phone)
      return response.badRequest(req, res, 'All informations are required !');

    // make sure email is unique
    const emailAlreadyExist = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    if (emailAlreadyExist) return response.conflict(req, res, 'Email already exist !');

    // Upload image to storage and save image
    let profile_url = '';
    let profile_url2 = '';
    let profile_url3 = '';

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
          profile_url = await uploader['presigned'].presignedGet(profile.key, 3600);
          profile_url2 = `http://${envs.MINIO_ENDPOINT}:${envs.MINIO_PORT}/${envs.MINIO_APP_BUCKET}/${profile.key}`;
          profile_url3 = `http://${req.get('host')}/api/v1/files/${profile.key}`;

          log.info(profile_url2);
        }
      } catch (err: any) {
        return response.unprocessable(req, res, `Failed to upload avatar: ${err}`);
      }
    }

    log.info(`Profile URL 1: ${profile_url}`);
    log.info(`Profile URL 2: ${profile_url2}`);
    log.info(`Profile URL 3: ${profile_url3}`);

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
        avatar_url: profile_url2,
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });
    if (!create_employee) return response.unprocessable(req, res, 'failed to create user !');

    // Mail to send OTP email to the user
    // const user_full_name = last_name + ' ' + first_name;

    // send_mail(
    //   email,
    //   'otp_template'
    //   {
    //     date: now,
    //     name: user_full_name,
    //     otp: user_otp,
    //   }
    // )

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
