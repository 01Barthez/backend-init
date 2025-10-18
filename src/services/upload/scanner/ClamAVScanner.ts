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
  private readonly MAX_RETRIES = 3; // Augmenté à 3 tentatives
  private readonly RETRY_DELAY = 2000; // Augmenté à 2 secondes
  private readonly SCAN_TIMEOUT_MS = 300000; // Augmenté à 5 minutes
  private readonly SCAN_CHUNK_SIZE = 128 * 1024; // Augmenté à 128KB
  private readonly MAX_FILE_SIZE_MB = 100;
  private readonly CONNECTION_TIMEOUT_MS = 60000; // 60 secondes pour la connexion initiale

  constructor(opts: { host?: string; port?: number; timeoutMs?: number } = {}) {
    this.host = opts.host ?? process.env.CLAMAV_HOST ?? 'clamav';
    this.port = opts.port ?? Number(process.env.CLAMAV_PORT ?? 3310);
    this.timeoutMs = opts.timeoutMs ?? this.CONNECTION_TIMEOUT_MS;

    // Initial availability check with retry
    this.initializeScanner().catch((err) => {
      log.warn('Initial ClamAV initialization failed', { error: err.message });
    });

    // Periodic health check
    setInterval(() => this.checkAvailability(), this.CHECK_INTERVAL_MS);
  }

  private async initializeScanner(): Promise<void> {
    try {
      await this.checkAvailability();
      log.info('ClamAV scanner initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Failed to initialize ClamAV scanner', { error: errorMessage });
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY * attempt));
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (this.isServiceAvailable) {
        log.error('ClamAV service became unavailable', { error: errorMessage });
      }
      this.isServiceAvailable = false;
      this.lastError = error instanceof Error ? error : new Error(errorMessage);
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
    const scanId = `${filename}-${startTime}`;

    // Vérifier la taille du fichier
    if (fileSize > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE_MB}MB`);
    }

    log.info('Starting file scan', {
      scanId,
      filename,
      size: fileSize,
      maxFileSize: `${this.MAX_FILE_SIZE_MB}MB`,
      timeout: `${this.SCAN_TIMEOUT_MS}ms`,
    });

    try {
      // Vérifier la disponibilité du service
      if (!(await this.isAvailable())) {
        throw new Error('ClamAV service is not available');
      }

      // Créer un timeout pour le scan
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Scan timed out after ${this.SCAN_TIMEOUT_MS}ms`));
        }, this.SCAN_TIMEOUT_MS);
      });

      // Exécuter le scan avec timeout
      const scanPromise = (async () => {
        const clamd = this.getClamdClient();

        // Convertir le buffer en stream si nécessaire
        const stream = Buffer.isBuffer(streamOrBuffer)
          ? require('stream').Readable.from(streamOrBuffer)
          : streamOrBuffer;

        // Exécuter le scan avec retry
        return this.withRetry(async () => {
          return new Promise<ScanResult>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const writeStream = require('net').connect({
              host: this.host,
              port: this.port,
              timeout: this.timeoutMs,
            });

            writeStream.on('connect', () => {
              writeStream.write('zINSTREAM\0');

              stream.on('data', (chunk: Buffer) => {
                const size = Buffer.alloc(4);
                size.writeUInt32BE(chunk.length, 0);
                writeStream.write(Buffer.concat([size, chunk]));
              });

              stream.on('end', () => {
                writeStream.write(Buffer.from([0, 0, 0, 0])); // Signal de fin
              });

              stream.on('error', (err: Error) => {
                writeStream.destroy();
                reject(err);
              });
            });

            writeStream.on('data', (data: Buffer) => {
              chunks.push(data);
            });

            writeStream.on('end', () => {
              const response = Buffer.concat(chunks).toString('utf8').trim();
              const isInfected = !response.endsWith('OK');
              const threat = isInfected ? response.split(' ')[1] : undefined;

              resolve({
                ok: !isInfected,
                reason: isInfected ? 'infected' : 'clean',
                threat,
                scanDuration: Date.now() - startTime,
                scannedAt: new Date(),
                fileInfo: {
                  name: filename,
                  size: fileSize,
                },
              });
            });

            writeStream.on('error', (err: Error) => {
              reject(err);
            });
          });
        });
      })();

      return await Promise.race([scanPromise, timeoutPromise]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Scan failed', {
        scanId,
        error: errorMessage,
        duration: Date.now() - startTime,
        filename,
        size: fileSize,
      });
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  private getClamdClient() {
    const net = require('net');
    const { promisify } = require('util');

    const socket = new net.Socket();

    // Configure socket timeouts
    socket.setTimeout(this.timeoutMs);
    socket.setKeepAlive(true, 60000); // Enable keep-alive with 60s delay

    const clamd = {
      host: this.host,
      port: this.port,
      socket: socket,
      timeout: this.timeoutMs,

      // Custom promisified methods
      ping: promisify(function (host: string, port: number, callback: Function) {
        const socket = new net.Socket();
        let connected = false;

        const timeout = setTimeout(() => {
          if (!connected) {
            socket.destroy();
            callback(new Error('Connection timeout'));
          }
        }, 10000); // 10s timeout for ping

        socket.on('connect', () => {
          connected = true;
          clearTimeout(timeout);
          socket.write('zPING\0');
        });

        socket.on('data', (data: Buffer) => {
          if (data.toString().trim() === 'PONG') {
            socket.end();
            callback(null, true);
          } else {
            socket.destroy();
            callback(new Error('Invalid response from ClamAV'));
          }
        });

        socket.on('error', (err: Error) => {
          clearTimeout(timeout);
          callback(err);
        });

        socket.connect(port, host);
      }),

      // Other methods...
    };

    return clamd;
  }
}
