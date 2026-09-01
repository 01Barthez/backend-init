/**
 * Telegram Authentication Controller
 * Handles Telegram Login Widget authentication
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/mail/send-mail.service';
import userToken from '@/services/jwt/jwt.service';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

const telegramAuth = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const authData = req.body;

    if (!authData || !authData.hash) {
      return response.badRequest(req, res, 'Invalid Telegram authentication data');
    }

    try {
      const telegramService = oauthManager.getTelegramService();

      const isValid = telegramService.verifyTelegramAuth(authData);
      if (!isValid) {
        return response.unauthorized(req, res, 'Invalid Telegram authentication');
      }

      const userProfile = telegramService.getUserProfile(authData);

      if (!userProfile.email) {
        userProfile.email = `telegram_${userProfile.providerUserId}@telegram.oauth`;
      }

      const tokenData = {
        access_token: authData.hash,
        token_type: 'telegram',
        scope: 'read',
      };

      const { user, isNewUser } = await oauthManager.findOrCreateUser(userProfile, tokenData);

      const accessToken = userToken.accessToken(user);
      const refreshToken = userToken.refreshToken(user);

      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('Telegram login successful', {
        telegramId: userProfile.providerUserId,
        isNewUser,
      });

      if (isNewUser && user.email && !user.email.includes('@telegram.oauth')) {
        const userFullName = `${user.lastName} ${user.firstName}`;
        send_mail(user.email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: userFullName,
        }).catch((mailError) => {
          log.warn('Failed to send welcome email', {
            error: mailError.message,
          });
        });
      }

      return response.ok(
        req,
        res,
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileUrl: user.avatarUrl,
          isNewUser,
        },
        'Telegram login successful',
      );
    } catch (error: any) {
      log.error('Telegram authentication failed', {
        error: error.message,
      });

      return response.serverError(req, res, 'Telegram authentication failed');
    }
  },
);

export default telegramAuth;
