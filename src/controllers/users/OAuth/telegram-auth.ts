/**
 * Telegram Authentication Controller
 * Handles Telegram Login Widget authentication
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

/**
 * Handle Telegram authentication
 * POST /auth/oauth/telegram
 */
const telegram_auth = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const authData = req.body;

    if (!authData || !authData.hash) {
      return response.badRequest(req, res, 'Invalid Telegram authentication data');
    }

    try {
      const telegramService = oauthManager.getTelegramService();

      // Verify Telegram authentication data
      const isValid = telegramService.verifyTelegramAuth(authData);
      if (!isValid) {
        return response.unauthorized(req, res, 'Invalid Telegram authentication');
      }

      // Get user profile from Telegram data
      const userProfile = telegramService.getUserProfile(authData);

      // Since Telegram doesn't provide email, we need to handle this differently
      // Option 1: Require email in a second step
      // Option 2: Use telegram ID as unique identifier without email
      // For this implementation, we'll use Option 2 with a generated email

      if (!userProfile.email) {
        userProfile.email = `telegram_${userProfile.provider_user_id}@telegram.oauth`;
      }

      // Create mock token data for Telegram (no actual OAuth tokens)
      const tokenData = {
        access_token: authData.hash,
        token_type: 'telegram',
        scope: 'read',
      };

      // Find or create user
      const { user, isNewUser } = await oauthManager.findOrCreateUser(userProfile, tokenData);

      // Generate JWT tokens
      const accessToken = userToken.accessToken(user);
      const refreshToken = userToken.refreshToken(user);

      // Set cookies
      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('Telegram login successful', {
        telegram_id: userProfile.provider_user_id,
        isNewUser,
      });

      // Send welcome email for new users (if real email is provided)
      if (isNewUser && user.email && !user.email.includes('@telegram.oauth')) {
        const user_full_name = `${user.last_name} ${user.first_name}`;
        send_mail(user.email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: user_full_name,
        }).catch((error) => {
          log.warn('Failed to send welcome email', {
            error: error.message,
          });
        });
      }

      return response.ok(
        req,
        res,
        {
          id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_url: user.avatar_url,
          is_new_user: isNewUser,
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

export default telegram_auth;
