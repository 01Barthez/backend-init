import { lookup as mimeLookup } from 'mime-types';

import { ValidationError } from '../core/errors';
import { extFromFilename } from '../core/utils';
import type { FileMeta, ValidationPolicy } from '../core/validation-policy';

/**
 * Size / MIME / extension checks, plus magic-byte sniffing when a buffer is
 * provided so a renamed `.exe` cannot pass as `image/jpeg`.
 *
 * Uses dynamic import: `file-type` ≥22 is ESM-only (fixes GHSA-5v7r-6r5c-r473).
 */
export class Validator {
  constructor(
    private defaultPolicy: ValidationPolicy,
    private profiles: Record<string, ValidationPolicy> = {},
  ) {}

  private getPolicy(profile?: string): ValidationPolicy {
    if (profile && this.profiles[profile]) {
      return { ...this.defaultPolicy, ...this.profiles[profile] };
    }
    return this.defaultPolicy;
  }

  async validate(meta: FileMeta, buffer?: Buffer, profile?: string): Promise<true> {
    const policy = this.getPolicy(profile ?? meta.profile);
    const ext = extFromFilename(meta.filename);
    let detectedMime = meta.contentType || mimeLookup(meta.filename) || 'application/octet-stream';

    if (buffer && buffer.length > 0) {
      // ESM-only package — keep CommonJS/TS emit compatible via dynamic import.
      const { fileTypeFromBuffer } = await import('file-type');
      const magic = await fileTypeFromBuffer(buffer);
      if (!magic) {
        throw new ValidationError('magic_bytes_unknown', { filename: meta.filename });
      }
      detectedMime = magic.mime;
    }

    if (policy.maxSizeBytes && meta.size && meta.size > policy.maxSizeBytes) {
      throw new ValidationError('file_too_large', { max: policy.maxSizeBytes, actual: meta.size });
    }

    if (policy.allowedMimeTypes && policy.allowedMimeTypes.length > 0) {
      if (!policy.allowedMimeTypes.includes(detectedMime)) {
        throw new ValidationError('mime_not_allowed', { detectedMime });
      }
    }

    if (policy.allowedExtensions && policy.allowedExtensions.length > 0) {
      if (!policy.allowedExtensions.includes(ext)) {
        throw new ValidationError('extension_not_allowed', { ext });
      }
    }

    return true;
  }
}
