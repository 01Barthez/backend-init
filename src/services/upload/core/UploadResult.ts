export interface UploadResult {
  // Informations de base
  bucket: string;
  key: string;
  path: string;
  size: number;
  originalName: string;
  mimeType: string;

  // Métadonnées temporelles
  uploadedAt: string;
  uploadDuration: number;

  // Résultat du scan
  scanResult: 'clean' | 'infected' | 'error' | 'not_scanned';
  scanDetails?: {
    scannedAt: Date;
    duration: number;
    threat?: string;
  };

  // Métadonnées supplémentaires
  metadata?: Record<string, string>;

  // Pour la rétrocompatibilité
  location?: string;
  etag?: string;
  versionId?: string;
}
