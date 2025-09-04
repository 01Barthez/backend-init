import { MinioUploader } from '@/services/upload/Minio-s3-uploader';

import { minioClient } from './minioClient';

export const uploader = new MinioUploader({
  client: minioClient,
  bucket: 'my-app-uploads',
  basePath: 'uploads/',
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
});
