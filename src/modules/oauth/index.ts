import type { Router } from 'express';

import { envs } from '@/app/config';
import { type TokenServicePort, createDefaultAuthDeps } from '@/modules/auth';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import {
  createMailerAdapter,
  createRbacAdapter,
} from '@/modules/auth/infrastructure/providers/legacy-adapters';

import { AuthorizeCommand } from './application/commands/authorize.command';
import { CallbackCommand } from './application/commands/callback.command';
import { ListAccountsQuery } from './application/commands/list-accounts.command';
import { TelegramAuthCommand } from './application/commands/telegram-auth.command';
import { UnlinkCommand } from './application/commands/unlink.command';
import type { OAuthManager } from './infrastructure/manager/oauth-manager.service';
import { oauthManager as defaultOAuthManager } from './infrastructure/manager/oauth-manager.service';
import {
  type OAuthController,
  createOAuthController,
} from './presentation/controllers/oauth.controller';
import { createOAuthRoutes } from './presentation/routes/oauth.routes';

/**
 * Explicit dependencies for the oauth module.
 */
export type OAuthModuleDeps = {
  oauthManager: OAuthManager;
  tokenService: TokenServicePort;
  rbac: RbacPort;
  mailer: MailerPort;
  clientUrl?: string;
};

export type OAuthModule = {
  deps: OAuthModuleDeps;
  useCases: {
    authorize: AuthorizeCommand;
    callback: CallbackCommand;
    unlink: UnlinkCommand;
    listAccounts: ListAccountsQuery;
    telegramAuth: TelegramAuthCommand;
  };
  controller: OAuthController;
  router: Router;
};

/**
 * Builds default infrastructure adapters (shared with auth token/mail/rbac).
 */
export function createDefaultOAuthDeps(overrides: Partial<OAuthModuleDeps> = {}): OAuthModuleDeps {
  const authDeps = createDefaultAuthDeps();

  return {
    oauthManager: overrides.oauthManager ?? defaultOAuthManager,
    tokenService: overrides.tokenService ?? authDeps.tokenService,
    rbac: overrides.rbac ?? createRbacAdapter(),
    mailer: overrides.mailer ?? createMailerAdapter(),
    clientUrl: overrides.clientUrl ?? envs.CLIENT_URL,
  };
}

/**
 * Composition root for the oauth bounded context.
 */
export function createOAuthModule(deps: OAuthModuleDeps): OAuthModule {
  const useCases = {
    authorize: new AuthorizeCommand(deps),
    callback: new CallbackCommand(deps),
    unlink: new UnlinkCommand(deps),
    listAccounts: new ListAccountsQuery(deps),
    telegramAuth: new TelegramAuthCommand(deps),
  };

  const controller = createOAuthController(useCases);
  const router = createOAuthRoutes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired OAuth Express router. */
export function createOAuthRouter(overrides: Partial<OAuthModuleDeps> = {}): Router {
  return createOAuthModule(createDefaultOAuthDeps(overrides)).router;
}

export type {
  IOAuthAccountData,
  IOAuthCallbackQuery,
  IOAuthProviderConfig,
  IOAuthService,
  IOAuthState,
  IOAuthTokenResponse,
  IOAuthUserProfile,
} from './domain/types/oauth.types';
export { OAuthProvider } from './domain/types/oauth.types';
export { BaseOAuthService } from './infrastructure/base-oauth.service';
export { OAuthManager, oauthManager } from './infrastructure/manager/oauth-manager.service';
export { FacebookOAuthService } from './infrastructure/providers/facebook-oauth.service';
export { GitHubOAuthService } from './infrastructure/providers/github-oauth.service';
export { GoogleOAuthService } from './infrastructure/providers/google-oauth.service';
export { InstagramOAuthService } from './infrastructure/providers/instagram-oauth.service';
export { LinkedInOAuthService } from './infrastructure/providers/linkedin-oauth.service';
export { TelegramOAuthService } from './infrastructure/providers/telegram-oauth.service';
export { TwitterOAuthService } from './infrastructure/providers/twitter-oauth.service';
export { oauthSchemas } from './presentation/schemas/oauth.schemas';
