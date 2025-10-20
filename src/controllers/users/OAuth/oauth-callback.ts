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
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

/**
 * Handle OAuth callback from provider
 * GET /auth/oauth/:provider/callback
 */
const oauth_callback = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query as IOAuthCallbackQuery;

    // Validate provider
    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    // Check for OAuth errors
    if (error) {
      log.error('OAuth provider returned error', {
        provider: providerUpper,
        error,
        error_description,
      });

      return response.badRequest(req, res, error_description || 'OAuth authorization failed');
    }

    // Validate authorization code
    if (!code) {
      return response.badRequest(req, res, OAUTH_ERRORS.MISSING_CODE);
    }

    try {
      // Verify state parameter (CSRF protection)
      const stateCookie = req.cookies[OAUTH_COOKIES.STATE];
      if (!stateCookie || !state) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      const stateData: IOAuthState = JSON.parse(Buffer.from(stateCookie, 'base64').toString());

      if (stateData.state !== state || !oauthManager.verifyState(stateData)) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      // Clear state cookie
      res.clearCookie(OAUTH_COOKIES.STATE);

      // Exchange authorization code for access token
      const tokenData = await oauthManager.exchangeCodeForToken(providerUpper, code);

      // Get user profile from provider
      const userProfile = await oauthManager.getUserProfile(providerUpper, tokenData.access_token);

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

      log.info('OAuth login successful', {
        provider: providerUpper,
        email: user.email,
        isNewUser,
      });

      // Send welcome email for new users (non-blocking)
      if (isNewUser) {
        const user_full_name = `${user.last_name} ${user.first_name}`;
        send_mail(user.email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: user_full_name,
        }).catch((error) => {
          log.warn('Failed to send welcome email', {
            email: user.email,
            error: error.message,
          });
        });
      } else {
        // Send login alert for existing users
        const user_full_name = `${user.last_name} ${user.first_name}`;
        send_mail(user.email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
          name: user_full_name,
          date: new Date(),
        }).catch((error) => {
          log.warn('Failed to send login alert email', {
            email: user.email,
            error: error.message,
          });
        });
      }

      // Redirect to client application or return JSON
      const redirectUrl = stateData.redirect_url || envs.CLIENT_URL;

      if (redirectUrl) {
        // Redirect with token in query (for web apps)
        const redirectUrlWithToken = `${redirectUrl}?token=${accessToken}&refresh_token=${refreshToken}`;
        return res.redirect(redirectUrlWithToken);
      }

      // Return JSON response (for API clients)
      return response.ok(
        req,
        res,
        {
          id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          profile_url: user.avatar_url,
          is_new_user: isNewUser,
        },
        `OAuth login successful via ${providerUpper}`,
      );
    } catch (error: any) {
      log.error('OAuth callback failed', {
        provider: providerUpper,
        error: error.message,
      });

      return response.serverError(req, res, error.message || 'OAuth authentication failed');
    }
  },
);

export default oauth_callback;
