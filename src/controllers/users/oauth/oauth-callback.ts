/**
 * OAuth Callback Controller
 * Handles OAuth provider callback after user authorization
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { AUTH_COOKIES } from '@/core/constants/app.constants';
import { MAIL } from '@/core/constants/mail.constants';
import { OAUTH_COOKIES, OAUTH_ERRORS } from '@/core/constants/oauth.constants';
import type { IOAuthCallbackQuery, IOAuthState } from '@/core/interfaces/oauth.interface';
import { OAuthProvider } from '@/core/interfaces/oauth.interface';
import jwtService from '@/services/auth/jwt.service';
import rbacService from '@/services/auth/rbac.service';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/set-safe-cookie';

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

      const { permissions, roles } = await rbacService.getUserAuthContext(user.id);
      const tokenPair = jwtService.issueTokenPair(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isActive: user.isActive,
        },
        permissions,
        roles,
      );

      await jwtService.persistRefreshToken(
        user.id,
        tokenPair.refreshToken,
        tokenPair.refreshJti,
        tokenPair.familyId,
      );

      res.setHeader('authorization', `Bearer ${tokenPair.accessToken}`);
      setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, tokenPair.refreshToken, {
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
        queueMail({
          to: user.email,
          subject: MAIL.WELCOME_SUBJECT,
          template: 'welcome',
          data: { name: userFullName },
        }).catch((mailError) => {
          log.warn('Failed to queue welcome email', {
            email: user.email,
            error: mailError.message,
          });
        });
      } else {
        queueMail({
          to: user.email,
          subject: MAIL.LOGIN_ALERT_SUBJECT,
          template: 'alert-login',
          data: { name: userFullName, date: new Date() },
        }).catch((mailError) => {
          log.warn('Failed to queue login alert email', {
            email: user.email,
            error: mailError.message,
          });
        });
      }

      const redirectUrl = stateData.redirectUrl || envs.CLIENT_URL;

      if (redirectUrl) {
        const redirectUrlWithToken = `${redirectUrl}?token=${tokenPair.accessToken}&refresh_token=${tokenPair.refreshToken}`;
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
          roles,
          permissions,
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
