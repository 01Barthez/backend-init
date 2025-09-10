import log from '@services/logging/logger';
import { Readable } from 'stream';

import type { ScanResult, Scanner } from './Scanner';

export class ClamAVScanner implements Scanner {
  private readonly host: string;
  private readonly port: number;
  private readonly timeoutMs: number;
  private isServiceAvailable: boolean = false;
  private lastError?: Error;
  private lastChecked: Date = new Date(0);
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly SCAN_TIMEOUT_MS = 30000; // 30 seconds max per scan

  constructor(opts: { host?: string; port?: number; timeoutMs?: number } = {}) {
    this.host = opts.host ?? process.env.CLAMAV_HOST ?? 'clamav';
    this.port = opts.port ?? Number(process.env.CLAMAV_PORT) ?? 3310;
    this.timeoutMs = opts.timeoutMs ?? 15000; // 15 seconds for initial connection

    // Initial availability check
    this.checkAvailability().catch((err) => {
      log.warn('Initial ClamAV availability check failed', { error: err.message });
    });

    // Periodic health check
    setInterval(() => this.checkAvailability(), this.CHECK_INTERVAL_MS);
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }

  async isAvailable(): Promise<boolean> {
    // Use cached value if checked recently
    const now = Date.now();
    if (now - this.lastChecked.getTime() < this.CHECK_INTERVAL_MS / 2) {
      return this.isServiceAvailable;
    }

    return this.checkAvailability();
  }

  private async checkAvailability(): Promise<boolean> {
    try {
      await this.withRetry(async () => {
        const clamdjs = this.getClamdClient();
        await clamdjs.ping(this.host, this.port);
      });
      
      if (!this.isServiceAvailable) {
        log.info('ClamAV service is now available');
      }
      
      this.isServiceAvailable = true;
      this.lastError = undefined;
    } catch (error) {
      if (this.isServiceAvailable) {
        log.error('ClamAV service became unavailable', { error });
      }
      this.isServiceAvailable = false;
      this.lastError = error as Error;
    }

    this.lastChecked = new Date();
    return this.isServiceAvailable;
  }

  async scan(
    streamOrBuffer: Buffer | NodeJS.ReadableStream,
    filename: string,
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const fileSize = Buffer.isBuffer(streamOrBuffer) ? streamOrBuffer.length : 0;
    const scanId = `${filename}-${Date.now()}`;

    log.info('Starting file scan', {
      scanId,
      filename,
      size: fileSize,
    });

    try {
      // Check if service is available with a quick ping first
      if (!(await this.isAvailable())) {
        throw new Error('ClamAV service is not available');
      }

      const clamdjs = this.getClamdClient();
      const scanner = clamdjs.createScanner(this.host, this.port);

      const input = Buffer.isBuffer(streamOrBuffer)
        ? Readable.from([streamOrBuffer])
        : streamOrBuffer;

      // Wrap the scan in a timeout
      const scanPromise = new Promise<ScanResult>((resolve, reject) => {
        scanner.scanStream(input, (err: any, reply: any) => {
          const scanDuration = Date.now() - startTime;
          
          if (err) {
            log.error('Scan error', { 
              scanId, 
              error: err, 
              duration: scanDuration,
              filename,
              size: fileSize
            });
            return reject(err);
          }

          const text = String(reply?.toString?.() ?? reply ?? '').trim();

          if (/OK$/i.test(text)) {
            log.info('Scan completed - Clean', {
              scanId,
              filename,
              size: fileSize,
              duration: scanDuration,
            });
            return resolve({
              ok: true,
              reason: 'clean',
              scanDuration,
              scannedAt: new Date(),
              fileInfo: {
                name: filename,
                size: fileSize
              }
            });
          }

          // If we get here, the file might be infected
          const threat = text.split('FOUND')[0]?.trim() || 'Unknown threat';
          log.warn('Scan detected threat', {
            scanId,
            filename,
            threat,
            duration: scanDuration,
          });
          
          resolve({
            ok: false,
            reason: 'infected',
            threat,
            scanDuration,
            scannedAt: new Date(),
            fileInfo: {
              name: filename,
              size: fileSize
            }
          });
        });
      });

      // Add timeout to the scan operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const duration = Date.now() - startTime;
          log.warn('Scan timed out', { scanId, duration, filename, size: fileSize });
          reject(new Error(`Scan timed out after ${duration}ms`));
        }, this.SCAN_TIMEOUT_MS);
      });

      // Race between the scan and the timeout
      return await Promise.race([scanPromise, timeoutPromise]);
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('Scan failed', { 
        scanId, 
        error: error instanceof Error ? error.message : String(error),
        duration,
        filename,
        size: fileSize
      });
      
      return {
        ok: false,
        reason: error instanceof Error ? 
          (error.message.includes('timeout') ? 'timeout' : 'error') : 
          'service_unavailable',
        scanDuration: duration,
        threat: 'Scan failed',
        scannedAt: new Date(),
        fileInfo: {
          name: filename,
          size: fileSize
        }
      };
    }
  }

  private getClamdClient() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('clamdjs');
    } catch (e) {
      log.error('clamdjs module not installed');
      throw new Error('ClamAV client is not properly configured');
    }
  }

  private createErrorResult(
    reason: 'error' | 'timeout' | 'service_unavailable',
    message: string,
    raw?: any,
  ): ScanResult {
    return {
      ok: false,
      reason,
      scannedAt: new Date(),
      scanDuration: 0,
      raw: raw || message,
    };
  }
}
