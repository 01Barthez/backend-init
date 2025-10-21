import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';

const oauth = Router();

// ============================================
// OAUTH2.0 ROUTES - Social Authentication
// ============================================

// Initiate OAuth flow (redirects to provider)
// Supported providers: google, github, facebook, instagram, twitter, linkedin
oauth.get('/:provider', users_controller.oauth_authorize);

// OAuth callback (provider redirects here after authorization)
oauth.get('/:provider/callback', users_controller.oauth_callback);

// Telegram authentication (widget-based)
oauth.post('/telegram', users_controller.telegram_auth);

// ============================================
// OAUTH2.0 PROTECTED ROUTES
// ============================================

// Get user's linked OAuth accounts
oauth.get(
  '/accounts',
  // isAuthenticated,
  users_controller.oauth_accounts,
);

// Unlink OAuth provider from account
oauth.delete(
  '/:provider/unlink',
  // isAuthenticated,
  users_controller.oauth_unlink,
);

export default oauth;
