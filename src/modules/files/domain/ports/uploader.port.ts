import type { FileMeta, UploadOptions, UploadResult } from '../types/upload.types';

/**
 * Port for validated user-facing uploads (avatars, documents, etc.).
 * Distinct from shared StorageProvider used for backups / bootstrap.
 */
export interface UploaderPort {
  uploadBuffer(buffer: Buffer, meta: FileMeta, opts?: UploadOptions): Promise<UploadResult>;
  presignPut(input: {
    filename: string;
    contentType: string;
    size: number;
    /** When set, object key is namespaced under uploads/{ownerId}/. */
    ownerId?: string;
  }): Promise<{ url: string; key: string; expiresIn: number }>;
  presignGet(key: string): Promise<{ url: string; expiresIn: number }>;
}
