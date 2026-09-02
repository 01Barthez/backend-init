import { envs } from '@/app/config';
import { STORAGE_BUCKETS, STORAGE_PATHS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';

import type {
  AvatarUploadFile,
  AvatarUploaderPort,
} from '../../application/services/avatar-uploader.port';

const buildPublicUrl = (bucket: string, key: string): string => {
  if (envs.MINIO_PUBLIC_URL) {
    return `${envs.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${bucket}/${key}`;
  }

  const protocol = envs.MINIO_USE_SSL ? 'https' : 'http';
  const host =
    envs.MINIO_ENDPOINT === 'minio' || envs.MINIO_ENDPOINT === 'localhost'
      ? 'localhost'
      : envs.MINIO_ENDPOINT;

  return `${protocol}://${host}:${envs.MINIO_PORT}/${bucket}/${key}`;
};

/**
 * Uploads avatars via the existing MinIO uploader (validation + path categories).
 * Swap to `@/shared/infrastructure/storage` when that facade gains category policies.
 */
export class AvatarUploaderAdapter implements AvatarUploaderPort {
  async upload(file?: AvatarUploadFile): Promise<string> {
    if (!file) return '';

    try {
      const { uploader } = await import('@/modules/files');

      const profile = await uploader.uploadBuffer(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        category: STORAGE_PATHS.USER_AVATARS,
      });

      if (!profile?.key) {
        throw new Error('No file key returned from uploader');
      }

      return buildPublicUrl(STORAGE_BUCKETS.UPLOADS, profile.key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      log.error('Avatar upload failed', { error: message });
      throw new Error(`Failed to upload avatar: ${message}`);
    }
  }
}

/** Functional helper kept for auth / legacy call sites. */
export async function uploadAvatar(file?: AvatarUploadFile): Promise<string> {
  return new AvatarUploaderAdapter().upload(file);
}
