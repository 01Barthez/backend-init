import { envs } from '@/config/env/env';
import { MinioUploader } from '@/services/upload/Minio-s3-uploader';

export const minioClient = new MinioUploader({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: envs.MINIO_ACCESS_KEY!,
  secretKey: envs.MINIO_SECRET_KEY!,
});
