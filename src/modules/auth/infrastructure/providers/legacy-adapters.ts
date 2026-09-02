import type {
  AvatarUploadFile,
  AvatarUploaderPort,
} from '../../application/services/avatar-uploader.port';
import type { MailerPort, QueueMailInput } from '../../application/services/mailer.port';
import type { RbacPort } from '../../application/services/rbac.port';
import type { UserCachePort } from '../../application/services/user-cache.port';

/**
 * Default adapters bridging sibling modules into auth application ports.
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
  async getUserAuthContext(userId: string) {
    const { rbacService } = await import('@/modules/rbac');
    return rbacService.getUserAuthContext(userId);
  },
  async assignDefaultRole(userId: string, slug?: string) {
    const { rbacService } = await import('@/modules/rbac');
    if (slug) {
      await rbacService.assignDefaultRole(userId, slug);
      return;
    }
    await rbacService.assignDefaultRole(userId);
  },
});

export const createAvatarUploaderAdapter = (): AvatarUploaderPort => ({
  async upload(file?: AvatarUploadFile): Promise<string> {
    const { uploadAvatar } = await import('@/modules/users');
    return uploadAvatar(file);
  },
});

export const createUserCacheAdapter = (): UserCachePort => ({
  async invalidate(userId: string, email?: string): Promise<void> {
    const { createDefaultUsersDeps } = await import('@/modules/users');
    const { userCache } = createDefaultUsersDeps();
    await userCache.invalidate(userId, email);
  },
});
