import { MinioUploader } from '@/services/upload/MinioUploader';
import { ClamAVScanner } from '@/services/upload/scanner/ClamAVScanner';

import { envs } from '../env/env';
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
  // multipartThreshold: 20 * 1024 * 1024,
  // multipartPartSize: 10 * 1024 * 1024,
  maxRetries: 5,
  // concurrency: 4,
  // scanner: new ClamAVScanner({
  //   host: 'clamd.local',
  //   port: 3310,
  // }),
});

uploader.on('uploaded', (info) => console.log('uploaded', info));
