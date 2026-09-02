import { MinioUploader } from '../upload/MinioUploader';
import { minioClient } from '../upload/_config/minioClient';
import { NotificationService } from './notifications/backup.notifications';

// Initialize MinIO uploader
export const initUploader = () => {
  return new MinioUploader({
    client: minioClient,
    bucket: process.env.MINIO_BUCKET || 'backups',
    defaultPolicy: {
      maxSizeBytes: 1024 * 1024 * 1024, // 1GB
      allowedMimeTypes: ['application/gzip', 'application/x-gzip'],
    },
  });
};

// Initialize notification service
export const initNotificationService = () => {
  return new NotificationService();
};
