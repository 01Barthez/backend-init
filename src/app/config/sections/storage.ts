/**
 * Object storage configuration.
 * Supports MinIO (default for local/dev) and S3-compatible providers in production.
 * Swap providers via STORAGE_PROVIDER without touching business code.
 */
import { fromEnv } from '../env';

export const storageConfig = {
  /** Active provider: `minio` | `s3`. */
  provider: fromEnv.get('STORAGE_PROVIDER').default('minio').asString(),

  minio: {
    endpoint: fromEnv.get('MINIO_ENDPOINT').default('localhost').asString(),
    port: fromEnv.get('MINIO_PORT').required().asPortNumber(),
    accessKey: fromEnv.get('MINIO_ACCESS_KEY').required().asString(),
    secretKey: fromEnv.get('MINIO_SECRET_KEY').required().asString(),
    useSsl: fromEnv.get('MINIO_USE_SSL').default('false').asBool(),
    appBucket: fromEnv.get('MINIO_APP_BUCKET').default('app-uploads').asString(),
    basePath: fromEnv.get('MINIO_BASE_PATH').default('uploads/').asString(),
    publicUrl: fromEnv.get('MINIO_PUBLIC_URL').default('').asString(),
  },

  s3: {
    region: fromEnv.get('S3_REGION').default('us-east-1').asString(),
    accessKey: fromEnv.get('S3_ACCESS_KEY').default('').asString(),
    secretKey: fromEnv.get('S3_SECRET_KEY').default('').asString(),
    bucket: fromEnv.get('S3_BUCKET').default('').asString(),
    endpoint: fromEnv.get('S3_ENDPOINT').default('').asString(),
    port: fromEnv.get('S3_PORT').default('443').asPortNumber(),
    useSsl: fromEnv.get('S3_USE_SSL').default('true').asBool(),
    publicUrl: fromEnv.get('S3_PUBLIC_URL').default('').asString(),
  },

  clamav: {
    host: fromEnv.get('CLAMAV_HOST').default('clamav').asString(),
    port: fromEnv.get('CLAMAV_PORT').required().asPortNumber(),
    timeoutMs: fromEnv.get('CLAMAV_TIMEOUT').default(20000).asInt(),
    /** When true, uploads fail if ClamAV is unreachable. */
    required: fromEnv.get('CLAMAV_REQUIRED').default('false').asBool(),
  },

  /** Multipart through the API is for avatars only. Larger files use presigned PUT. */
  upload: {
    apiMaxBytes: fromEnv
      .get('API_UPLOAD_MAX_BYTES')
      .default(2 * 1024 * 1024)
      .asInt(),
    presignMaxBytes: fromEnv
      .get('PRESIGN_UPLOAD_MAX_BYTES')
      .default(50 * 1024 * 1024)
      .asInt(),
    presignTtlSeconds: fromEnv.get('PRESIGN_TTL_SECONDS').default(300).asInt(),
  },
} as const;

export type StorageConfig = typeof storageConfig;
