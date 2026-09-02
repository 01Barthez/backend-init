import { UploadAvatarCommand } from './application/commands/upload-avatar.command';
import { UploadFileCommand } from './application/commands/upload-file.command';
import type { ScannerPort } from './domain/ports/scanner.port';
import type { UploaderPort } from './domain/ports/uploader.port';
import { MinioUploaderAdapter } from './infrastructure/adapters/minio-uploader.adapter';
import { uploader as defaultMinioUploader } from './infrastructure/config/minio';

/**
 * Explicit dependencies for the files module.
 */
export type FilesModuleDeps = {
  uploader: UploaderPort;
  scanner?: ScannerPort;
};

export type FilesModule = {
  deps: FilesModuleDeps;
  useCases: {
    uploadAvatar: UploadAvatarCommand;
    uploadFile: UploadFileCommand;
  };
};

/**
 * Builds default infrastructure adapters (MinIO uploader singleton).
 */
export function createDefaultFilesDeps(overrides: Partial<FilesModuleDeps> = {}): FilesModuleDeps {
  return {
    uploader: overrides.uploader ?? new MinioUploaderAdapter(defaultMinioUploader),
    scanner: overrides.scanner,
  };
}

/**
 * Composition root for the files bounded context.
 * No HTTP router — uploads are consumed by auth / users / blog modules.
 */
export function createFilesModule(deps: FilesModuleDeps): FilesModule {
  const useCases = {
    uploadAvatar: new UploadAvatarCommand(deps),
    uploadFile: new UploadFileCommand(deps),
  };

  return { deps, useCases };
}

/** Convenience helpers for common call sites. */
export async function uploadAvatar(
  file?: Parameters<UploadAvatarCommand['execute']>[0],
): Promise<string> {
  return createFilesModule(createDefaultFilesDeps()).useCases.uploadAvatar.execute(file);
}

export async function uploadFile(
  ...args: Parameters<UploadFileCommand['execute']>
): ReturnType<UploadFileCommand['execute']> {
  return createFilesModule(createDefaultFilesDeps()).useCases.uploadFile.execute(...args);
}

// Domain
export {
  FileUploadError,
  FileValidationError,
  VirusDetectedError,
} from './domain/errors/files.errors';
export type { ScannerPort, ScanResult } from './domain/ports/scanner.port';
export type { UploaderPort } from './domain/ports/uploader.port';
export type {
  FileMeta,
  UploadOptions,
  UploadResult,
  ValidationPolicy,
} from './domain/types/upload.types';

// Infrastructure re-exports (swap MinIO / S3 / ClamAV here)
export { uploader } from './infrastructure/config/minio';
export { minioClient } from './infrastructure/config/minio-client';
export { UploadError, ValidationError } from './infrastructure/core/errors';
export type { Uploader } from './infrastructure/core/uploader';
export { MinioUploader } from './infrastructure/minio-uploader';
export { MinioProvider } from './infrastructure/providers/minio.provider';
export { S3Provider } from './infrastructure/providers/s3.provider';
export { ClamAVScanner } from './infrastructure/scanner/clamav-scanner';
export type { Scanner } from './infrastructure/scanner/scanner';
export { MultipartService } from './infrastructure/services/multipart.service';
export { PresignedUrlService } from './infrastructure/services/presigned-url.service';

// Presentation
export { upload } from './presentation/upload.middleware';

// Also re-export shared storage for backups / bootstrap (orthogonal to validated uploads)
export { type StorageProvider, storageService } from '@/shared/infrastructure/storage';
