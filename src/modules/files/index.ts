import type { Router } from 'express';

import { CreatePresignedDownloadCommand } from './application/commands/create-presigned-download.command';
import { CreatePresignedUploadCommand } from './application/commands/create-presigned-upload.command';
import { UploadAvatarCommand } from './application/commands/upload-avatar.command';
import { UploadFileCommand } from './application/commands/upload-file.command';
import type { ScannerPort } from './domain/ports/scanner.port';
import type { UploaderPort } from './domain/ports/uploader.port';
import { MinioUploaderAdapter } from './infrastructure/adapters/minio-uploader.adapter';
import { uploader as defaultMinioUploader } from './infrastructure/config/minio';
import {
  type FilesController,
  createFilesController,
} from './presentation/controllers/files.controller';
import { createFilesRoutes } from './presentation/routes/files.routes';

export type FilesModuleDeps = {
  uploader: UploaderPort;
  scanner?: ScannerPort;
};

export type FilesModule = {
  deps: FilesModuleDeps;
  useCases: {
    uploadAvatar: UploadAvatarCommand;
    uploadFile: UploadFileCommand;
    createPresignedUpload: CreatePresignedUploadCommand;
    createPresignedDownload: CreatePresignedDownloadCommand;
  };
  controller: FilesController;
  router: Router;
};

export function createDefaultFilesDeps(overrides: Partial<FilesModuleDeps> = {}): FilesModuleDeps {
  return {
    uploader: overrides.uploader ?? new MinioUploaderAdapter(defaultMinioUploader),
    scanner: overrides.scanner,
  };
}

export function createFilesModule(deps: FilesModuleDeps): FilesModule {
  const useCases = {
    uploadAvatar: new UploadAvatarCommand(deps),
    uploadFile: new UploadFileCommand(deps),
    createPresignedUpload: new CreatePresignedUploadCommand(deps),
    createPresignedDownload: new CreatePresignedDownloadCommand(deps),
  };

  const controller = createFilesController({
    createPresignedUpload: useCases.createPresignedUpload,
    createPresignedDownload: useCases.createPresignedDownload,
  });
  const router = createFilesRoutes(controller);

  return { deps, useCases, controller, router };
}

export function createFilesRouter(overrides: Partial<FilesModuleDeps> = {}): Router {
  return createFilesModule(createDefaultFilesDeps(overrides)).router;
}

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
export { upload } from './presentation/upload.middleware';
export { type StorageProvider, storageService } from '@/shared/infrastructure/storage';
