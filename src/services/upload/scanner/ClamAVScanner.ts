import { Readable } from 'stream';

import type { ScanResult, Scanner } from './Scanner';

export class ClamAVScanner implements Scanner {
  host: string;
  port: number;
  timeoutMs: number;

  constructor(opts: { host?: string; port?: number; timeoutMs?: number } = {}) {
    this.host = opts.host ?? '127.0.0.1';
    this.port = opts.port ?? 3310;
    this.timeoutMs = opts.timeoutMs ?? 20000;
  }

  async scan(streamOrBuffer: Readable | Buffer): Promise<ScanResult> {
    let clamdjs: any;
    try {
      clamdjs = require('clamdjs');
    } catch (e) {
      return { ok: false, reason: 'clamdjs_not_installed', raw: e };
    }

    try {
      const scanner = clamdjs.createScanner(this.host, this.port);
      return await new Promise<ScanResult>((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          resolve({ ok: false, reason: 'clamd_timeout' });
        }, this.timeoutMs);

        const input =
          streamOrBuffer instanceof Buffer ? Readable.from([streamOrBuffer]) : streamOrBuffer;

        scanner.scanStream(input, (err: any, reply: any) => {
          clearTimeout(timer);
          if (timedOut) return;
          if (err) return resolve({ ok: false, reason: 'clamd_error', raw: err });

          const text = String(reply?.toString?.() ?? reply ?? '');
          if (/OK$/i.test(text)) return resolve({ ok: true });
          return resolve({ ok: false, reason: 'infected', raw: text });
        });
      });
    } catch (err) {
      return { ok: false, reason: 'clamd_exception', raw: err };
    }
  }
}
