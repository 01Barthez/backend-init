export type ScanResult = {
  ok: boolean;
  reason?: 'clean' | 'infected' | 'error' | 'timeout' | 'unsupported' | 'service_unavailable';
  threat?: string;
  fileInfo?: {
    name: string;
    size: number;
    mimeType?: string;
  };
  scannedAt: Date;
  scanDuration: number;
  raw?: unknown;
};

/**
 * Antivirus scanner port. Swap ClamAV for another engine without touching use cases.
 */
export interface ScannerPort {
  scan(streamOrBuffer: Buffer | NodeJS.ReadableStream, filename: string): Promise<ScanResult>;
  isAvailable(): Promise<boolean>;
}
