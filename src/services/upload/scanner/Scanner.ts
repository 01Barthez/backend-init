import type { Readable } from 'stream';

export type ScanResult = { ok: true } | { ok: false; reason: string; raw?: any };

export interface Scanner {
  scan(stream: Readable | Buffer, filename?: string): Promise<ScanResult>;
}
