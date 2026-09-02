/**
 * OAuth Authorization Controller
 * Initiates OAuth flow by redirecting to provider
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { OAUTH_COOKIES, OAUTH_ERRORS } from '@/core/constants/oauth.constants';
import { OAuthProvider } from '@/core/interfaces/oauth.interface';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

const oauthAuthorize = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const { redirectUrl } = req.query;

    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    try {
      const stateData = oauthManager.generateState(redirectUrl as string);
      const stateString = Buffer.from(JSON.stringify(stateData)).toString('base64');

      res.cookie(OAUTH_COOKIES.STATE, stateString, {
        httpOnly: true,
        secure: envs.COOKIE_SECURE as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
        maxAge: 15 * 60 * 1000,
      });

      const authUrl = oauthManager.getAuthorizationUrl(providerUpper, stateData.state);

      log.info('OAuth authorization initiated', {
        provider: providerUpper,
        redirectUrl,
      });

      return res.redirect(authUrl);
    } catch (error: any) {
      log.error('OAuth authorization failed', {
        provider: providerUpper,
        error: error.message,
      });

      return response.serverError(
        req,
        res,
        error.message || 'Failed to initiate OAuth authorization',
      );
    }
  },
);

export default oauthAuthorize;
