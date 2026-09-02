import { envs } from '@/config/env/env';
import { STORAGE_BUCKETS, STORAGE_PATHS } from '@/core/constants/app.constants';
import log from '@/services/logging/logger';
import { uploader } from '@/services/upload/_config/minio';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

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

export async function uploadAvatar(file?: UploadFile): Promise<string> {
  if (!file) return '';

  try {
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
  } catch (error: any) {
    log.error('Avatar upload failed', { error: error.message });
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
}
