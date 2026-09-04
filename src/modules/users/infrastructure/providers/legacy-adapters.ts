import type { AuthSessionSummary } from '@/modules/auth/domain/types/auth.types';

import type { MailerPort, QueueMailInput } from '../../application/services/mailer.port';
import type { RbacPort } from '../../application/services/rbac.port';
import type { SessionPort } from '../../application/services/session.port';

/**
 * Factory: returns a thin adapter that delegates session listing to the auth token repository.
 * Used by the admin GetUserSessionsQuery without creating a direct module-level dependency.
 */
export const createListSessionsAdapter =
  () =>
  async (userId: string): Promise<AuthSessionSummary[]> => {
    const { PrismaTokenRepository } = await import(
      '@/modules/auth/infrastructure/repositories/prisma-token.repository'
    );
    const repo = new PrismaTokenRepository();
    return repo.listSessionsForUser(userId);
  };

/**
 * Factory: returns a thin adapter that delegates OAuth account unlinking to OAuthManager.
 * Used by AdminUnlinkOAuthCommand without a direct oauth module dependency.
 */
export const createUnlinkOAuthAdapter =
  () =>
  async (userId: string, provider: string): Promise<void> => {
    const { oauthManager } = await import(
      '@/modules/oauth/infrastructure/manager/oauth-manager.service'
    );
    const { OAuthProvider } = await import('@/modules/oauth/domain/types/oauth.types');
    const providerEnum = provider.toUpperCase() as (typeof OAuthProvider)[keyof typeof OAuthProvider];
    await oauthManager.unlinkOAuthAccount(userId, providerEnum);
  };

/**
 * Default adapters bridging shared / sibling modules into users application ports.
 */

export const createMailerAdapter = (): MailerPort => ({
  async queue(input: QueueMailInput): Promise<void> {
    const { queueMail } = await import('@/shared/infrastructure/mail');
    await queueMail({
      to: input.to,
      subject: input.subject,
      template: input.template as never,
      data: input.data,
    });
  },
});

export const createRbacAdapter = (): RbacPort => ({
  async assignRole(userId: string, roleSlug: string): Promise<void> {
    const { rbacService } = await import('@/modules/rbac');
    await rbacService.assignRole(userId, roleSlug);
  },

  async getRoles(userId: string): Promise<string[]> {
    const { rbacService } = await import('@/modules/rbac');
    const ctx = await rbacService.getUserAuthContext(userId);
    return ctx.roles;
  },
});

export const createSessionAdapter = (): SessionPort => ({
  async revokeAllForUser(userId: string): Promise<void> {
    const { PrismaTokenRepository } = await import(
      '@/modules/auth/infrastructure/repositories/prisma-token.repository'
    );
    const tokens = new PrismaTokenRepository();
    await tokens.revokeAllForUser(userId, 'ADMIN_REVOKE');
  },

  async createPasswordResetToken(userId: string): Promise<string> {
    const { jwtService } = await import('@/modules/auth/infrastructure/providers/jwt.service');
    return jwtService.createPasswordResetToken(userId);
  },
});
