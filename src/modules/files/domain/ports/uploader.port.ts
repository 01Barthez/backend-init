import type { FileMeta, UploadOptions, UploadResult } from '../types/upload.types';

/**
 * Port for validated user-facing uploads (avatars, documents, etc.).
 * Distinct from shared StorageProvider used for backups / bootstrap.
 */
export interface UploaderPort {
  uploadBuffer(buffer: Buffer, meta: FileMeta, opts?: UploadOptions): Promise<UploadResult>;
}
