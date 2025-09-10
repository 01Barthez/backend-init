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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor(opts: { host?: string; port?: number; timeoutMs?: number } = {}) {
    this.host = opts.host ?? process.env.CLAMAV_HOST ?? 'clamav';
    this.port = opts.port ?? Number(process.env.CLAMAV_PORT) ?? 3310;
    this.timeoutMs = opts.timeoutMs ?? 20000;

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
      // Vérifier si le service est disponible
      if (!(await this.isAvailable())) {
        throw new Error('ClamAV service is not available');
      }

      const clamdjs = this.getClamdClient();
      const scanner = clamdjs.createScanner(this.host, this.port);

      const input = Buffer.isBuffer(streamOrBuffer)
        ? Readable.from([streamOrBuffer])
        : streamOrBuffer;

      const result = await new Promise<ScanResult>((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          log.warn('Scan timed out', { scanId, duration: Date.now() - startTime });
          resolve(this.createErrorResult('timeout', 'Scan operation timed out'));
        }, this.timeoutMs);

        scanner.scanStream(input, (err: any, reply: any) => {
          clearTimeout(timer);
          if (timedOut) return;

          const scanDuration = Date.now() - startTime;

          if (err) {
            log.error('Scan error', { scanId, error: err, duration: scanDuration });
            return resolve(this.createErrorResult('error', err.message, err));
          }

          const text = String(reply?.toString?.() ?? reply ?? '').trim();

          if (/OK$/i.test(text)) {
            log.info('Scan completed - Clean', {
              scanId,
              duration: scanDuration,
              result: 'clean',
            });
            return resolve({
              ok: true,
              reason: 'clean',
              scannedAt: new Date(),
              scanDuration,
              fileInfo: { name: filename, size: fileSize },
            });
          }

          // Détection d'infection
          const threat = text.replace(/^stream: /i, '').replace(/ FOUND$/, '');
          log.warn('Infection detected', {
            scanId,
            threat,
            duration: scanDuration,
          });

          resolve({
            ok: false,
            reason: 'infected',
            threat,
            scannedAt: new Date(),
            scanDuration,
            fileInfo: { name: filename, size: fileSize },
            raw: text,
          });
        });
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error('Scan failed', {
        scanId,
        error: errorMsg,
        duration: Date.now() - startTime,
      });

      return this.createErrorResult('service_unavailable', `Scan failed: ${errorMsg}`, error);
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
