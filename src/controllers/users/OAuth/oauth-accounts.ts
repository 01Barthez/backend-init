/**
 * OAuth Accounts Controller
 * Get user's linked OAuth accounts
 */
import type { Request, Response } from 'express';

import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

/**
 * Get user's linked OAuth accounts
 * GET /auth/oauth/accounts
 * Requires authentication
 */
const oauth_accounts = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const userId = (req as any).user?.user_id; // From auth middleware

    if (!userId) {
      return response.unauthorized(req, res, 'Authentication required');
    }

    try {
      const accounts = await oauthManager.getUserOAuthAccounts(userId);

      // Remove sensitive data
      const sanitizedAccounts = accounts.map((account) => ({
        provider: account.provider,
        provider_email: account.provider_email,
        linked_at: account.expires_at,
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

export default oauth_accounts;
