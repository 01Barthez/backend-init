/**
 * Ambient shim: `file-type` ≥22 is ESM-only with `exports` that classic
 * `moduleResolution: "node"` cannot resolve. Runtime uses dynamic `import()`.
 */
declare module 'file-type' {
  export type FileTypeResult = {
    ext: string;
    mime: string;
  };

  export function fileTypeFromBuffer(
    buffer: Uint8Array | ArrayBuffer,
  ): Promise<FileTypeResult | undefined>;
}
