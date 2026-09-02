import { envs } from '@/app/config';
import { STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';

import { MinioUploader } from '../minio-uploader';
import { minioClient } from './minio-client';

export const uploader = new MinioUploader({
  client: minioClient,
  bucket: envs.MINIO_APP_BUCKET || STORAGE_BUCKETS.UPLOADS,
  basePath: envs.MINIO_BASE_PATH,
  defaultPolicy: {
    maxSizeBytes: 50 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
  },
  profiles: {
    avatar: {
      maxSizeBytes: 2 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxSizeBytes: 500 * 1024 * 1024,
      allowedMimeTypes: ['video/mp4'],
      allowedExtensions: ['mp4'],
    },
  },
  maxRetries: 5,
});

uploader.on('uploaded', (infos) => log.info('uploaded', infos));
