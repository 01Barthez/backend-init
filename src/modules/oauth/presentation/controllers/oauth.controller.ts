import type { Request, Response } from 'express';

import { envs } from '@/app/config';
import { AUTH_COOKIES } from '@/shared/constants/app.constants';
import { OAUTH_COOKIES } from '@/shared/constants/oauth.constants';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';
import setSafeCookie from '@/shared/utils/http/set-safe-cookie';

import type { AuthorizeCommand } from '../../application/commands/authorize.command';
import type { CallbackCommand } from '../../application/commands/callback.command';
import type { ListAccountsQuery } from '../../application/commands/list-accounts.command';
import type { TelegramAuthCommand } from '../../application/commands/telegram-auth.command';
import type { UnlinkCommand } from '../../application/commands/unlink.command';

type AuthenticatedRequest = Request & {
  user?: { id: string };
};

export type OAuthControllerDeps = {
  authorize: AuthorizeCommand;
  callback: CallbackCommand;
  unlink: UnlinkCommand;
  listAccounts: ListAccountsQuery;
  telegramAuth: TelegramAuthCommand;
};

const cookieOptions = {
  secure: envs.COOKIE_SECURE as boolean,
  httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
  sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
};

/**
 * Thin Express handlers for OAuth authorize / callback / unlink / accounts / Telegram.
 */
export function createOAuthController(deps: OAuthControllerDeps) {
  const oauthAuthorize = asyncHandler(async (req: Request, res: Response) => {
    const result = deps.authorize.execute({
      provider: req.params.provider,
      redirectUrl: req.query.redirectUrl as string | undefined,
    });

    res.cookie(OAUTH_COOKIES.STATE, result.stateCookieValue, {
      httpOnly: true,
      secure: envs.COOKIE_SECURE as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: result.stateCookieMaxAgeMs,
    });

    return res.redirect(result.authUrl);
  });

  const oauthCallback = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.callback.execute({
      provider: req.params.provider,
      code: req.query.code as string | undefined,
      state: req.query.state as string | undefined,
      error: req.query.error as string | undefined,
      errorDescription: req.query.error_description as string | undefined,
      stateCookie: req.cookies?.[OAUTH_COOKIES.STATE],
    });

    res.clearCookie(OAUTH_COOKIES.STATE);
    res.setHeader('authorization', `Bearer ${result.accessToken}`);
    setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, result.refreshToken, cookieOptions);

    if (result.redirectUrl) {
      const redirectUrlWithToken = `${result.redirectUrl}?token=${result.accessToken}&refresh_token=${result.refreshToken}`;
      return res.redirect(redirectUrlWithToken);
    }

    return response.ok(
      req,
      res,
      {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        phone: result.phone,
        profileUrl: result.profileUrl,
        isNewUser: result.isNewUser,
        roles: result.roles,
        permissions: result.permissions,
      },
      `OAuth login successful via ${req.params.provider.toUpperCase()}`,
    );
  });

  const oauthUnlink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      return response.unauthorized(req, res, 'Authentication required');
    }

    const provider = await deps.unlink.execute({
      userId: req.user.id,
      provider: req.params.provider,
    });

    return response.ok(req, res, null, `${provider} account unlinked successfully`);
  });

  const oauthAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      return response.unauthorized(req, res, 'Authentication required');
    }

    const accounts = await deps.listAccounts.execute({ userId: req.user.id });
    return response.ok(req, res, accounts, 'OAuth accounts retrieved successfully');
  });

  const telegramAuth = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.telegramAuth.execute({ authData: req.body });

    res.setHeader('authorization', `Bearer ${result.accessToken}`);
    setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, result.refreshToken, cookieOptions);

    return response.ok(
      req,
      res,
      {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        profileUrl: result.profileUrl,
        isNewUser: result.isNewUser,
        roles: result.roles,
        permissions: result.permissions,
      },
      'Telegram login successful',
    );
  });

  return {
    oauthAuthorize,
    oauthCallback,
    oauthUnlink,
    oauthAccounts,
    telegramAuth,
  };
}

export type OAuthController = ReturnType<typeof createOAuthController>;
