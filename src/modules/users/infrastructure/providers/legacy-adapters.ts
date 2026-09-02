import type { MailerPort, QueueMailInput } from '../../application/services/mailer.port';
import type { RbacPort } from '../../application/services/rbac.port';

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
});
