import type { MailerPort, QueueMailInput } from '../../application/services/mailer.port';
import type { RbacPort } from '../../application/services/rbac.port';
import type { SessionPort } from '../../application/services/session.port';

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
