/**
 * Result of a validated, optionally scanned object upload.
 */
export type UploadResult = {
  bucket: string;
  key: string;
  path: string;
  size: number;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
  uploadDuration: number;
  scanResult: 'clean' | 'infected' | 'error' | 'not_scanned';
  scanDetails?: {
    scannedAt: Date;
    duration: number;
    threat?: string;
  };
  metadata?: Record<string, string>;
  location?: string;
  etag?: string;
  versionId?: string;
};

export type FileMeta = {
  filename: string;
  contentType?: string;
  size?: number;
  /** Object key prefix inside the bucket, e.g. users/avatars */
  category?: string;
  /** Validation profile name (e.g. `avatar`). */
  profile?: string;
};

export type ValidationPolicy = {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
};

export type UploadOptions = {
  profile?: string;
  prefix?: string;
  datePartition?: boolean;
};
