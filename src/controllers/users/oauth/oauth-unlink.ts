/**
 * OAuth Unlink Controller
 * Unlinks an OAuth provider from user account
 */
import type { Request, Response } from 'express';

import { OAUTH_ERRORS } from '@/core/constants/oauth.constants';
import { OAuthProvider } from '@/core/interfaces/oauth.interface';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

const oauthUnlink = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return response.unauthorized(req, res, 'Authentication required');
    }

    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    try {
      await oauthManager.unlinkOAuthAccount(userId, providerUpper);

      log.info('OAuth account unlinked', {
        userId,
        provider: providerUpper,
      });

      return response.ok(req, res, null, `${providerUpper} account unlinked successfully`);
    } catch (error: any) {
      log.error('Failed to unlink OAuth account', {
        userId,
        provider: providerUpper,
        error: error.message,
      });

      return response.serverError(req, res, 'Failed to unlink OAuth account');
    }
  },
);

export default oauthUnlink;
