import { envs } from '@/app/config';
import { STORAGE_BUCKETS, STORAGE_PATHS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';

import type { UploaderPort } from '../../domain/ports/uploader.port';

export type AvatarFileInput = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type UploadAvatarCommandDeps = {
  uploader: UploaderPort;
};

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
 * Uploads a user avatar and returns a public URL (empty string when no file).
 */
export class UploadAvatarCommand {
  constructor(private readonly deps: UploadAvatarCommandDeps) {}

  async execute(file?: AvatarFileInput): Promise<string> {
    if (!file) return '';

    try {
      const result = await this.deps.uploader.uploadBuffer(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        category: STORAGE_PATHS.USER_AVATARS,
      });

      if (!result?.key) {
        throw new Error('No file key returned from uploader');
      }

      return buildPublicUrl(STORAGE_BUCKETS.UPLOADS, result.key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      log.error('Avatar upload failed', { error: message });
      throw new Error(`Failed to upload avatar: ${message}`);
    }
  }
}
