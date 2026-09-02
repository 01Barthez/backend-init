import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';
import { uploader } from '@/services/upload/_config/minio';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export async function uploadAvatar(file?: UploadFile): Promise<string> {
  if (!file) return '';

  try {
    const profile = await uploader.uploadBuffer(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      size: file.size,
    });

    if (!profile?.key) {
      throw new Error('No file key returned from uploader');
    }

    const url = `http${envs.MINIO_USE_SSL ? 's' : ''}://localhost${
      [80, 443].includes(Number(envs.MINIO_PORT)) ? '' : `:${envs.MINIO_PORT}`
    }/${envs.MINIO_APP_BUCKET}/${profile.key}`;

    return url;
  } catch (error: any) {
    log.error('Avatar upload failed', { error: error.message });
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
}
