# Files module

Validated user uploads (avatars, documents) with ClamAV scanning and presigned
large-object I/O. Distinct from **shared storage**
(`@/shared/infrastructure/storage`), which handles backups, bucket bootstrap,
and raw object put/get.

## Layout

```
files/
├── domain/            # UploadResult, UploaderPort, ScannerPort, errors
├── application/       # UploadAvatar, UploadFile, presign commands
├── infrastructure/    # MinioUploader, ClamAV, magic-byte validator
├── presentation/      # Multer middleware + /presign routes
├── index.ts
└── README.md
```

## HTTP

Mounted at `{API_PREFIX}/files` (auth + verified + active):

| Method | Path       | Purpose                                           |
| ------ | ---------- | ------------------------------------------------- |
| POST   | `/presign` | Presigned PUT (`filename`, `contentType`, `size`) |
| GET    | `/presign` | Presigned GET (`key` query)                       |

Avatars stay multipart on **auth signup** and **users profile**
(`upload.single('profile')`), capped at `API_UPLOAD_MAX_BYTES` (2MB). Magic-byte
sniff (`file-type`): `avatar` profile = jpeg/png; default = jpeg/png/pdf.

Presign caps: `PRESIGN_UPLOAD_MAX_BYTES`, `PRESIGN_TTL_SECONDS`.

## Public API

```ts
import {
  uploadAvatar,
  uploadFile,
  createFilesModule,
  createDefaultFilesDeps,
  createFilesRouter,
  upload, // multer middleware
  uploader,
  ClamAVScanner,
} from '@/modules/files';

const url = await uploadAvatar(req.file);
```

Pass the `avatar` profile from `UploadAvatarCommand` so jpeg/png-only rules
apply.

## ClamAV

Injected on the singleton in `infrastructure/config/minio.ts` (omitted in
tests). Unreachable daemon **fails open** unless `CLAMAV_REQUIRED=true`.

## Swapping backends

| Concern                          | Default                           | How to swap                                                                  |
| -------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Object store (validated uploads) | `MinioUploader` + `MinioProvider` | Implement `UploaderPort` and pass via `createDefaultFilesDeps({ uploader })` |
| Shared storage (backups)         | `@/shared/infrastructure/storage` | Set `STORAGE_PROVIDER=s3` or implement `StorageProvider`                     |
| Antivirus                        | `ClamAVScanner`                   | Implement `ScannerPort` and pass `scanner` into `MinioUploader` config       |

See [Storage providers](../../../docs/guides/storage-providers.md).
