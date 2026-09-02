import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';

import type { OAuthController } from '../controllers/oauth.controller';

/**
 * OAuth HTTP routes — path contract mirrors the legacy `oauth.router.ts`.
 * Mounted at `/api/v1/auth/oauth`. Authenticated routes for accounts / unlink.
 */
export function createOAuthRoutes(controller: OAuthController): Router {
  const oauth = Router();

  /** GET /accounts — List OAuth providers linked to the current user. */
  oauth.get('/accounts', authenticate, requireVerified, requireActive, controller.oauthAccounts);

  /** POST /telegram — Authenticate via Telegram Login Widget payload. */
  oauth.post('/telegram', controller.telegramAuth);

  /** GET /:provider — Redirect to the OAuth provider authorization screen. */
  oauth.get('/:provider', controller.oauthAuthorize);

  /** GET /:provider/callback — Handle provider callback and complete login/link. */
  oauth.get('/:provider/callback', controller.oauthCallback);

  /** DELETE /:provider/unlink — Unlink a social provider from the current user. */
  oauth.delete(
    '/:provider/unlink',
    authenticate,
    requireVerified,
    requireActive,
    controller.oauthUnlink,
  );

  return oauth;
}
