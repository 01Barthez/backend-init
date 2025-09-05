// /*
// minio-s3-uploader.ts

// Intégration :
// - Scanner antivirus (interface extensible + impl. ClamAV via TCP/clamd)
// - Multipart upload manuel (création, upload part, list parts, complete, abort) avec reprise
// - Hooks / events pour progress, monitoring
// - Optimisations : p-limit pour limiter concurrence, backpressure-friendly streams,
//   transformation pipeline (ex: sharp) via hooks, et possibilité d'utiliser AWS S3 SDK si préféré
// - Configurabilité et profils de validation
// - Tests & observabilité facilités

// Dépendances optionnelles recommandées :
// - minio
// - mime-types
// - p-limit
// - clamdjs (ou tout client clamd compatible) OR un binaire clamscan CLI
// - @aws-sdk/client-s3 (optionnel, pour implémentation multipart S3-compatible si tu préfères)
// - sharp (optionnel pour transformations d'images)
// */
// import EventEmitter from 'events';
// import { lookup as mimeLookup } from 'mime-types';
// import type { BucketItem, Client as MinioClient } from 'minio';
// import PQueue from 'p-limit';
// import { Readable } from 'stream';

// // ---------------------------- Types & Interfaces ----------------------------

// export type UploadResult = {
//   bucket: string;
//   key: string;
//   etag?: string | undefined;
//   size?: number | undefined;
//   location?: string | undefined;
//   uploadId?: string | undefined; // present for multipart
// };

// export type FileMeta = {
//   filename: string;
//   contentType?: string;
//   size?: number; // bytes (if known)
// };

// export type ValidationPolicy = {
//   maxSizeBytes?: number; // default global if absent
//   allowedMimeTypes?: string[];
//   allowedExtensions?: string[];
// };

// export type UploaderConfig = {
//   client: MinioClient | any; // Minio client or compatible S3 client
//   bucket: string;
//   basePath?: string;
//   defaultPolicy?: ValidationPolicy;
//   profiles?: Record<string, ValidationPolicy>;
//   multipartThreshold?: number; // bytes
//   multipartPartSize?: number; // bytes
//   maxRetries?: number;
//   concurrency?: number; // concurrent uploads/parts
//   logger?: { info(...args: any[]): void; warn(...args: any[]): void; error(...args: any[]): void };
//   scanner?: Scanner; // optional antivirus scanner
// };

// // Scanner interface (extensible) -------------------------------------------
// export type ScanResult = { ok: true } | { ok: false; reason: string; raw?: any };
// export interface Scanner {
//   /** scan a stream or buffer; return ScanResult */
//   scan(stream: Readable | Buffer, filename?: string): Promise<ScanResult>;
// }

// // Simple ClamAV scanner implementation (uses clamd via TCP) ---------------
// // Implementation note: this is an example. In production you may use a managed
// // malware scanning service (e.g., VirusTotal enterprise, OPSWAT MetaDefender)
// // or commercial engines for higher detection rates.

// export class ClamAVScanner implements Scanner {
//   host: string;
//   port: number;
//   timeoutMs: number;
//   constructor(opts: { host?: string; port?: number; timeoutMs?: number } = {}) {
//     this.host = opts.host ?? '127.0.0.1';
//     this.port = opts.port ?? 3310; // default clamd port
//     this.timeoutMs = opts.timeoutMs ?? 20000;
//   }

//   async scan(streamOrBuffer: Readable | Buffer): Promise<ScanResult> {
//     // Lazy require to avoid hard dependency if not used
//     let clamdjs: any;
//     try {
//       // try popular package name
//       // eslint-disable-next-line @typescript-eslint/no-var-requires
//       clamdjs = require('clamdjs');
//     } catch (e) {
//       return { ok: false, reason: 'clamdjs_not_installed', raw: e };
//     }

//     try {
//       // clamdjs provides a scanStream method talking to clamd via TCP
//       const scanner = clamdjs.createScanner(this.host, this.port);
//       return await new Promise<ScanResult>((resolve, reject) => {
//         let timedOut = false;
//         const timer = setTimeout(() => {
//           timedOut = true;
//           resolve({ ok: false, reason: 'clamd_timeout' });
//         }, this.timeoutMs);

//         // If we got a buffer, convert to stream
//         const input =
//           streamOrBuffer instanceof Buffer ? Readable.from([streamOrBuffer]) : streamOrBuffer;

//         scanner.scanStream(input, (err: any, reply: any) => {
//           clearTimeout(timer);
//           if (timedOut) return;
//           if (err) return resolve({ ok: false, reason: 'clamd_error', raw: err });
//           // reply example: 'stream: OK' or 'stream: Eicar-Test-Signature FOUND'
//           const text = String(reply?.toString?.() ?? reply ?? '');
//           if (/OK$/i.test(text)) return resolve({ ok: true });
//           return resolve({ ok: false, reason: 'infected', raw: text });
//         });
//       });
//     } catch (err) {
//       return { ok: false, reason: 'clamd_exception', raw: err };
//     }
//   }
// }

// // ---------------------------- Errors --------------------------------------

// export class ValidationError extends Error {
//   code = 'VALIDATION_ERROR';
//   details?: any;
//   constructor(message: string, details?: any) {
//     super(message);
//     this.details = details;
//   }
// }

// export class UploadError extends Error {
//   code = 'UPLOAD_ERROR';
//   details?: any;
//   constructor(message: string, details?: any) {
//     super(message);
//     this.details = details;
//   }
// }

// // ---------------------------- Utilitaires ---------------------------------

// function extFromFilename(filename: string) {
//   const idx = filename.lastIndexOf('.');
//   if (idx === -1) return '';
//   return filename.slice(idx + 1).toLowerCase();
// }

// function sleep(ms: number) {
//   return new Promise((res) => setTimeout(res, ms));
// }

// function defaultLogger() {
//   return {
//     info: (...args: any[]) => console.log('[uploader]', ...args),
//     warn: (...args: any[]) => console.warn('[uploader]', ...args),
//     error: (...args: any[]) => console.error('[uploader]', ...args),
//   };
// }

// // ---------------------------- Main Class ---------------------------------

// export class MinioUploader extends EventEmitter {
//   private client: MinioClient | any;
//   private bucket: string;
//   private basePath: string;
//   private defaultPolicy: ValidationPolicy;
//   private profiles: Record<string, ValidationPolicy>;
//   private multipartThreshold: number;
//   private multipartPartSize: number;
//   private maxRetries: number;
//   private concurrency: number;
//   private logger: UploaderConfig['logger'];
//   private scanner?: Scanner;
//   private limiter: (fn: () => Promise<any>) => Promise<any>;

//   constructor(config: UploaderConfig) {
//     super();
//     this.client = config.client;
//     this.bucket = config.bucket;
//     this.basePath = config.basePath ?? '';
//     this.defaultPolicy = config.defaultPolicy ?? { maxSizeBytes: 50 * 1024 * 1024 };
//     this.profiles = config.profiles ?? {};
//     this.multipartThreshold = config.multipartThreshold ?? 10 * 1024 * 1024;
//     this.multipartPartSize = config.multipartPartSize ?? 10 * 1024 * 1024;
//     this.maxRetries = config.maxRetries ?? 3;
//     this.concurrency = config.concurrency ?? 3;
//     this.logger = config.logger ?? defaultLogger();
//     this.scanner = config.scanner;
//     const limit = PQueue(this.concurrency);
//     this.limiter = (fn: () => Promise<any>) => limit(() => fn());
//   }

//   // key builder with optional date partitioning
//   private buildKey(filename: string, opts?: { prefix?: string; datePartition?: boolean }) {
//     const prefix = opts?.prefix ? `${opts.prefix.replace(/\/$/, '')}/` : '';
//     const datePart = opts?.datePartition
//       ? new Date().toISOString().slice(0, 10).replace(/-/g, '/') + '/'
//       : '';
//     const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
//     const key = `${this.basePath}${prefix}${datePart}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFilename}`;
//     return key.replace(/^\/+/, '');
//   }

//   private getPolicy(profile?: string): ValidationPolicy {
//     if (profile && this.profiles[profile])
//       return { ...this.defaultPolicy, ...this.profiles[profile] };
//     return this.defaultPolicy;
//   }

//   validate(meta: FileMeta, profile?: string) {
//     const policy = this.getPolicy(profile);
//     const ext = extFromFilename(meta.filename);
//     const detectedMime =
//       meta.contentType || mimeLookup(meta.filename) || 'application/octet-stream';

//     if (policy.maxSizeBytes && meta.size && meta.size > policy.maxSizeBytes) {
//       throw new ValidationError('file_too_large', { max: policy.maxSizeBytes, actual: meta.size });
//     }

//     if (policy.allowedMimeTypes && policy.allowedMimeTypes.length > 0) {
//       const ok = policy.allowedMimeTypes.includes(detectedMime);
//       if (!ok) throw new ValidationError('mime_not_allowed', { detectedMime });
//     }

//     if (policy.allowedExtensions && policy.allowedExtensions.length > 0) {
//       if (!policy.allowedExtensions.includes(ext))
//         throw new ValidationError('extension_not_allowed', { ext });
//     }

//     return true;
//   }

//   // -------------------- High level upload APIs ----------------------------

//   async uploadBuffer(
//     buffer: Buffer,
//     meta: FileMeta,
//     opts?: {
//       profile?: string;
//       prefix?: string;
//       datePartition?: boolean;
//       transform?: (buf: Buffer) => Promise<Buffer>;
//     },
//   ): Promise<UploadResult> {
//     this.validate(meta, opts?.profile);

//     // scan before any upload (optional)
//     if (this.scanner) {
//       const scan = await this.scanner.scan(buffer, meta.filename);
//       if (!scan.ok) throw new ValidationError('virus_detected', scan);
//     }

//     if (opts?.transform) {
//       buffer = await opts.transform(buffer);
//       meta.size = buffer.length;
//     }

//     const key = this.buildKey(meta.filename, {
//       prefix: opts?.prefix,
//       datePartition: opts?.datePartition,
//     });
//     const contentType = meta.contentType ?? mimeLookup(meta.filename) ?? 'application/octet-stream';

//     return this.retry(async () => {
//       await this.ensureBucketExists();
//       await this.client.putObject(this.bucket, key, buffer, buffer.length, {
//         'Content-Type': contentType,
//       });
//       this.logger.info('uploaded buffer', key);
//       this.emit('uploaded', { key, bucket: this.bucket, size: buffer.length });
//       return { bucket: this.bucket, key, size: buffer.length, location: key };
//     });
//   }

//   async uploadStream(
//     stream: Readable,
//     meta: FileMeta,
//     opts?: {
//       profile?: string;
//       prefix?: string;
//       datePartition?: boolean;
//       transformStream?: (s: Readable) => Readable;
//     },
//   ): Promise<UploadResult> {
//     this.validate(meta, opts?.profile);

//     // We need to scan the stream: to scan we need the bytes. We'll pipe into a PassThrough
//     // and duplicate it: one to scanner (buffered) and one to upload. For very large files
//     // scanning by buffering may be memory heavy — in production consider streaming scanners.

//     const key = this.buildKey(meta.filename, {
//       prefix: opts?.prefix,
//       datePartition: opts?.datePartition,
//     });
//     const contentType = meta.contentType ?? mimeLookup(meta.filename) ?? 'application/octet-stream';

//     // If scanner exists, buffer the stream up to a limit
//     if (this.scanner) {
//       const chunks: Buffer[] = [];
//       const limit = 50 * 1024 * 1024; // 50MB buffer cap for scanning — configurable if you expose it
//       let total = 0;
//       for await (const chunk of stream) {
//         const buf: Buffer = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
//         chunks.push(buf);
//         total += buf.length;
//         if (total > limit) throw new ValidationError('scan_size_exceeded', { limit });
//       }
//       const buffer = Buffer.concat(chunks);
//       const scan = await this.scanner.scan(buffer, meta.filename);
//       if (!scan.ok) throw new ValidationError('virus_detected', scan);

//       // Recreate stream from buffer for upload
//       const uploadStream = Readable.from([buffer]);
//       return this.uploadStreamNoScan(
//         uploadStream,
//         { ...meta, size: buffer.length },
//         { ...opts, keyOverride: key },
//       );
//     }

//     return this.uploadStreamNoScan(stream, meta, { ...opts, keyOverride: key });
//   }

//   // internal: upload without scanning (stream provided)
//   private async uploadStreamNoScan(
//     stream: Readable,
//     meta: FileMeta,
//     opts?: { keyOverride?: string; transformStream?: (s: Readable) => Readable },
//   ): Promise<UploadResult> {
//     const key =
//       opts?.keyOverride ??
//       this.buildKey(meta.filename, { prefix: opts?.keyOverride ? undefined : undefined });

//     const finalStream = opts?.transformStream ? opts.transformStream(stream) : stream;

//     return this.retry(async () => {
//       await this.ensureBucketExists();
//       await this.client.putObject(this.bucket, key, finalStream, meta.size ?? undefined, {
//         'Content-Type': meta.contentType ?? 'application/octet-stream',
//       });
//       this.logger.info('uploaded stream', key);
//       this.emit('uploaded', { key, bucket: this.bucket, size: meta.size });
//       return { bucket: this.bucket, key, size: meta.size, location: key };
//     });
//   }

//   // -------------------- Multipart manual implementation ------------------

//   /**
//    * Start a multipart upload and return uploadId
//    * Supports both MinIO client (if it exposes .newMultipartUpload or .createMultipartUpload) and
//    * AWS S3 SDK (if provided). This method tries to call the client's createMultipartUpload-like method.
//    */
//   async createMultipartUpload(key: string, contentType?: string): Promise<string> {
//     // If client has 'createMultipartUpload' (S3-like)
//     if (typeof this.client.createMultipartUpload === 'function') {
//       const res = await this.client.createMultipartUpload({
//         Bucket: this.bucket,
//         Key: key,
//         ContentType: contentType,
//       });
//       const uploadId = res.UploadId || res.uploadId;
//       if (!uploadId) throw new UploadError('create_multipart_failed', res);
//       return uploadId;
//     }

//     // MinIO JS client does not expose createMultipartUpload in older versions; but it supports presigned uploads and
//     // putObject which internally uses multipart. For manual multipart with MinIO's JS SDK you may need to use AWS SDK.
//     throw new UploadError('create_multipart_not_supported_by_client');
//   }

//   /**
//    * Upload a single part. partNumber starts at 1.
//    * Returns an object with ETag and PartNumber.
//    */
//   async uploadPart(
//     key: string,
//     uploadId: string,
//     partNumber: number,
//     body: Buffer | Readable,
//   ): Promise<{ ETag: string; PartNumber: number }> {
//     if (typeof this.client.uploadPart === 'function') {
//       // S3-like clients
//       const params = {
//         Bucket: this.bucket,
//         Key: key,
//         PartNumber: partNumber,
//         UploadId: uploadId,
//         Body: body,
//       };
//       const res = await this.client.uploadPart(params);
//       return { ETag: res.ETag, PartNumber: partNumber };
//     }
//     throw new UploadError('upload_part_not_supported_by_client');
//   }

//   async listParts(key: string, uploadId: string) {
//     if (typeof this.client.listParts === 'function') {
//       return await this.client.listParts({ Bucket: this.bucket, Key: key, UploadId: uploadId });
//     }
//     throw new UploadError('list_parts_not_supported_by_client');
//   }

//   async completeMultipartUpload(
//     key: string,
//     uploadId: string,
//     parts: Array<{ ETag: string; PartNumber: number }>,
//   ) {
//     if (typeof this.client.completeMultipartUpload === 'function') {
//       const params = {
//         Bucket: this.bucket,
//         Key: key,
//         UploadId: uploadId,
//         MultipartUpload: { Parts: parts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })) },
//       };
//       return await this.client.completeMultipartUpload(params);
//     }
//     throw new UploadError('complete_multipart_not_supported_by_client');
//   }

//   async abortMultipartUpload(key: string, uploadId: string) {
//     if (typeof this.client.abortMultipartUpload === 'function') {
//       return await this.client.abortMultipartUpload({
//         Bucket: this.bucket,
//         Key: key,
//         UploadId: uploadId,
//       });
//     }
//     throw new UploadError('abort_multipart_not_supported_by_client');
//   }

//   /**
//    * High-level helper to perform manual multipart upload from a stream.
//    * - chunk size: this.multipartPartSize
//    * - concurrency: this.concurrency
//    * - resume: if provided uploadedParts metadata, will skip already uploaded parts
//    */
//   async multipartUploadManual(
//     stream: Readable,
//     meta: FileMeta,
//     opts?: {
//       profile?: string;
//       prefix?: string;
//       datePartition?: boolean;
//       resume?: { uploadId: string; parts: Array<{ PartNumber: number; ETag: string }> };
//     },
//   ) {
//     this.validate(meta, opts?.profile);
//     if (!meta.size) throw new ValidationError('size_required_for_multipart');

//     const key = this.buildKey(meta.filename, {
//       prefix: opts?.prefix,
//       datePartition: opts?.datePartition,
//     });

//     // create upload
//     const uploadId =
//       opts?.resume?.uploadId ?? (await this.createMultipartUpload(key, meta.contentType));

//     // generator that yields parts from stream
//     const partSize = this.multipartPartSize;
//     const parts: Array<{ PartNumber: number; ETag?: string }> =
//       opts?.resume?.parts?.map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag })) ?? [];

//     let partNumber = 1;
//     let buffer = Buffer.alloc(0);
//     const uploadedParts: Array<{ ETag: string; PartNumber: number }> =
//       opts?.resume?.parts?.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })) ?? [];

//     // We'll read the stream and for each chunk >= partSize we'll upload one part.
//     for await (const chunk of stream) {
//       const c = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
//       buffer = Buffer.concat([buffer, c]);
//       while (buffer.length >= partSize) {
//         const partBuffer = buffer.slice(0, partSize);
//         buffer = buffer.slice(partSize);
//         // skip if resume and part exists
//         if (uploadedParts.find((p) => p.PartNumber === partNumber)) {
//           this.logger.info(`skipping already uploaded part ${partNumber}`);
//         } else {
//           // upload part (possibly concurrent)
//           const uploadPromise = this.limiter(async () => {
//             const res = await this.uploadPart(key, uploadId, partNumber, partBuffer);
//             uploadedParts.push({ ETag: res.ETag, PartNumber: res.PartNumber });
//             this.emit('multipartPartUploaded', { key, uploadId, partNumber });
//             return res;
//           });
//           await uploadPromise; // we serialize here for simplicity; you can push promises to an array to run concurrently
//         }
//         partNumber++;
//       }
//     }

//     // final remainder
//     if (buffer.length > 0) {
//       if (uploadedParts.find((p) => p.PartNumber === partNumber)) {
//         this.logger.info(`skipping already uploaded final part ${partNumber}`);
//       } else {
//         const res = await this.uploadPart(key, uploadId, partNumber, buffer);
//         uploadedParts.push({ ETag: res.ETag, PartNumber: res.PartNumber });
//       }
//     }

//     // sort parts by PartNumber
//     uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);

//     // complete
//     await this.completeMultipartUpload(
//       key,
//       uploadId,
//       uploadedParts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })),
//     );
//     this.emit('multipartComplete', { key, uploadId, parts: uploadedParts });

//     return { bucket: this.bucket, key, size: meta.size, uploadId };
//   }

//   // -------------------- Helpers & wrappers -------------------------------

//   private async putObjectFromBuffer(key: string, buffer: Buffer, contentType: string) {
//     await this.client.putObject(this.bucket, key, buffer, buffer.length, {
//       'Content-Type': contentType,
//     });
//     this.logger.info('uploaded buffer', key);
//   }

//   private async ensureBucketExists() {
//     try {
//       const exists = await this.client.bucketExists(this.bucket);
//       if (!exists) {
//         this.logger.info('bucket not exists, creating', this.bucket);
//         await this.client.makeBucket(this.bucket);
//       }
//     } catch (err) {
//       this.logger.error('bucket check/create failed', err);
//       throw new UploadError('bucket_check_failed', err);
//     }
//   }

//   private async retry<T>(fn: () => Promise<T>) {
//     let attempt = 0;
//     const max = this.maxRetries;
//     while (true) {
//       try {
//         return await fn();
//       } catch (err) {
//         attempt++;
//         this.logger.warn(`upload attempt ${attempt} failed`);
//         if (attempt > max) {
//           this.logger.error('max retries reached', err);
//           throw new UploadError('max_retries_exceeded', { attempt, cause: err });
//         }
//         const backoff = Math.min(2000, 2 ** attempt * 100);
//         await sleep(backoff);
//       }
//     }
//   }

//   async list(prefix?: string): Promise<BucketItem[]> {
//     return new Promise((resolve, reject) => {
//       const items: BucketItem[] = [];
//       const stream = this.client.listObjectsV2(this.bucket, prefix ?? '', true);
//       stream.on('data', (obj: BucketItem) => items.push(obj));
//       stream.on('error', (err: any) => reject(err));
//       stream.on('end', () => resolve(items));
//     });
//   }

//   async remove(key: string) {
//     try {
//       await this.client.removeObject(this.bucket, key);
//       this.logger.info('removed object', key);
//     } catch (err) {
//       this.logger.error('remove failed', err);
//       throw err;
//     }
//   }

//   async presignedPutUrl(
//     filename: string,
//     expiresSeconds = 60 * 5,
//     opts?: { prefix?: string; datePartition?: boolean },
//   ) {
//     const key = this.buildKey(filename, {
//       prefix: opts?.prefix,
//       datePartition: opts?.datePartition,
//     });
//     const url = await this.client.presignedPutObject(this.bucket, key, expiresSeconds);
//     return { url, key };
//   }

//   async presignedGet(key: string, expirySeconds = 60 * 60) {
//     const url = await this.client.presignedGetObject(this.bucket, key, expirySeconds);
//     return url;
//   }
// }

// // ---------------------------- Usage Example -------------------------------
// /*
// import { Client as Minio } from 'minio';
// import { MinioUploader, ClamAVScanner } from './minio-s3-uploader';

// const minioClient = new Minio({
//   endPoint: 'localhost',
//   port: 9000,
//   useSSL: false,
//   accessKey: process.env.MINIO_ACCESS_KEY!,
//   secretKey: process.env.MINIO_SECRET_KEY!,
// });

// const uploader = new MinioUploader({
//   client: minioClient,
//   bucket: 'my-app-uploads',
//   basePath: 'uploads/',
//   defaultPolicy: { maxSizeBytes: 200 * 1024 * 1024 },
//   profiles: {
//     avatar: { maxSizeBytes: 2 * 1024 * 1024, allowedMimeTypes: ['image/jpeg','image/png'], allowedExtensions: ['jpg','jpeg','png'] },
//     video: { maxSizeBytes: 1024 * 1024 * 1024, allowedMimeTypes: ['video/mp4'], allowedExtensions: ['mp4'] }
//   },
//   multipartThreshold: 20 * 1024 * 1024,
//   multipartPartSize: 10 * 1024 * 1024,
//   maxRetries: 5,
//   concurrency: 4,
//   scanner: new ClamAVScanner({ host: 'clamd.local', port: 3310 }),
// });

// uploader.on('uploaded', (info) => console.log('uploaded', info));

// // Buffer upload
// // await uploader.uploadBuffer(Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain', size: 5 });

// // Stream upload
// // await uploader.uploadStream(req.file.stream, { filename: req.file.originalname, contentType: req.file.mimetype, size: req.file.size });

// // Manual multipart (if using AWS SDK client that's passed in the config)
// // const stream = fs.createReadStream('/big/file.mp4');
// // await uploader.multipartUploadManual(stream, { filename: 'big.mp4', contentType: 'video/mp4', size: fs.statSync('/big/file.mp4').size });
// */
