export interface UploadResult {
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
}
