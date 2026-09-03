import { config, envs } from '@/app/config';
import { STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';

import { MinioUploader } from '../minio-uploader';
import { ClamAVScanner } from '../scanner/clamav-scanner';
import { minioClient } from './minio-client';

const scanner = config.app.isTest ? undefined : new ClamAVScanner();

export const uploader = new MinioUploader({
  client: minioClient,
  bucket: envs.MINIO_APP_BUCKET || STORAGE_BUCKETS.UPLOADS,
  basePath: envs.MINIO_BASE_PATH,
  scanner,
  defaultPolicy: {
    maxSizeBytes: config.storage.upload.presignMaxBytes,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
  },
  profiles: {
    avatar: {
      maxSizeBytes: config.storage.upload.apiMaxBytes,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['jpg', 'jpeg', 'png'],
    },
  },
  maxRetries: 5,
});

uploader.on('uploaded', (infos) => log.info('uploaded', infos));
