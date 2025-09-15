import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';
import { MinioUploader } from '@/services/upload/MinioUploader';

// import { ClamAVScanner } from '@/services/upload/scanner/ClamAVScanner';

import { minioClient } from './minioClient';

export const uploader = new MinioUploader({
  client: minioClient,
  bucket: envs.MINIO_APP_BUCKET,
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
  // scanner: new ClamAVScanner({
  //   host: envs.CLAMAV_HOST || 'clamav',
  //   port: Number(envs.CLAMAV_PORT) || 3310,
  //   timeoutMs: 60000, // Augmenté à 60 secondes
  // }),
});

uploader.on('uploaded', (infos) => log.info('uploaded', infos));
