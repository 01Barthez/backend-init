/**
 * OAuth Accounts Controller
 * Get user's linked OAuth accounts
 */
import type { Request, Response } from 'express';

import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

const oauthAccounts = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return response.unauthorized(req, res, 'Authentication required');
    }

    try {
      const accounts = await oauthManager.getUserOAuthAccounts(userId);

      const sanitizedAccounts = accounts.map((account) => ({
        provider: account.provider,
        providerEmail: account.providerEmail,
        linkedAt: account.expiresAt,
      }));

      log.info('OAuth accounts retrieved', { userId });

      return response.ok(req, res, sanitizedAccounts, 'OAuth accounts retrieved successfully');
    } catch (error: any) {
      log.error('Failed to retrieve OAuth accounts', {
        userId,
        error: error.message,
      });

      return response.serverError(req, res, 'Failed to retrieve OAuth accounts');
    }
  },
);

export default oauthAccounts;
