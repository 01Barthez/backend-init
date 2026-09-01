/**
 * OAuth Callback Controller
 * Handles OAuth provider callback after user authorization
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { MAIL } from '@/core/constant/global';
import { OAUTH_COOKIES, OAUTH_ERRORS } from '@/core/constant/oauth.constant';
import type { IOAuthCallbackQuery, IOAuthState } from '@/core/interface/oauth.interface';
import { OAuthProvider } from '@/core/interface/oauth.interface';
import send_mail from '@/services/mail/send-mail.service';
import userToken from '@/services/jwt/jwt.service';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

const oauthCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query as IOAuthCallbackQuery;

    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    if (error) {
      log.error('OAuth provider returned error', {
        provider: providerUpper,
        error,
        error_description,
      });

      return response.badRequest(req, res, error_description || 'OAuth authorization failed');
    }

    if (!code) {
      return response.badRequest(req, res, OAUTH_ERRORS.MISSING_CODE);
    }

    try {
      const stateCookie = req.cookies[OAUTH_COOKIES.STATE];
      if (!stateCookie || !state) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      const stateData: IOAuthState = JSON.parse(Buffer.from(stateCookie, 'base64').toString());

      if (stateData.state !== state || !oauthManager.verifyState(stateData)) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      res.clearCookie(OAUTH_COOKIES.STATE);

      const tokenData = await oauthManager.exchangeCodeForToken(providerUpper, code);
      const userProfile = await oauthManager.getUserProfile(providerUpper, tokenData.access_token);
      const { user, isNewUser } = await oauthManager.findOrCreateUser(userProfile, tokenData);

      const accessToken = userToken.accessToken(user);
      const refreshToken = userToken.refreshToken(user);

      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('OAuth login successful', {
        provider: providerUpper,
        email: user.email,
        isNewUser,
      });

      const userFullName = `${user.lastName} ${user.firstName}`;

      if (isNewUser) {
        send_mail(user.email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: userFullName,
        }).catch((mailError) => {
          log.warn('Failed to send welcome email', {
            email: user.email,
            error: mailError.message,
          });
        });
      } else {
        send_mail(user.email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
          name: userFullName,
          date: new Date(),
        }).catch((mailError) => {
          log.warn('Failed to send login alert email', {
            email: user.email,
            error: mailError.message,
          });
        });
      }

      const redirectUrl = stateData.redirectUrl || envs.CLIENT_URL;

      if (redirectUrl) {
        const redirectUrlWithToken = `${redirectUrl}?token=${accessToken}&refresh_token=${refreshToken}`;
        return res.redirect(redirectUrlWithToken);
      }

      return response.ok(
        req,
        res,
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          profileUrl: user.avatarUrl,
          isNewUser,
        },
        `OAuth login successful via ${providerUpper}`,
      );
    } catch (callbackError: any) {
      log.error('OAuth callback failed', {
        provider: providerUpper,
        error: callbackError.message,
      });

      return response.serverError(req, res, callbackError.message || 'OAuth authentication failed');
    }
  },
);

export default oauthCallback;
