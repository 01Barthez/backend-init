/** Object storage infrastructure — port, providers, and facade. */
export { MinioStorageProvider } from './providers/minio.provider';
export { S3StorageProvider } from './providers/s3.provider';
export type { StorageProvider, UploadBufferParams, UploadFileParams } from './storage.port';
export { default, storageService } from './storage.service';
