export interface ScanResult {
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
  raw?: any;
}

export interface Scanner {
  scan(streamOrBuffer: Buffer | NodeJS.ReadableStream, filename: string): Promise<ScanResult>;
  isAvailable(): Promise<boolean>;
}
