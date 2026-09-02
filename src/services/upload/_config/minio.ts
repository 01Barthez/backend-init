import { envs } from '@/config/env/env';
import { STORAGE_BUCKETS } from '@/core/constants/app.constants';
import log from '@/services/logging/logger';
import { MinioUploader } from '@/services/upload/minio-uploader';

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
