# Files module

Validated user uploads (avatars, documents, media) with optional antivirus
scanning. Distinct from **shared storage** (`@/shared/infrastructure/storage`),
which handles backups, bucket bootstrap, and raw object put/get.

## Layout

```
files/
├── domain/            # UploadResult, UploaderPort, ScannerPort, errors
├── application/       # UploadAvatar, UploadFile commands
├── infrastructure/    # MinioUploader, ClamAV, multipart, presigned, providers
├── presentation/      # Multer middleware only (no dedicated HTTP routes)
├── index.ts
└── README.md
```

## Public API

```ts
import {
  uploadAvatar,
  uploadFile,
  createFilesModule,
  createDefaultFilesDeps,
  upload, // multer middleware
  uploader,
  ClamAVScanner,
} from '@/modules/files';

// Use cases
const url = await uploadAvatar(req.file);

// Custom DI
const files = createFilesModule(
  createDefaultFilesDeps({
    uploader: fakeUploader,
  }),
);
```

## Swapping backends

| Concern                          | Default                                                  | How to swap                                                                                |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Object store (validated uploads) | `MinioUploader` + `MinioProvider`                        | Implement `UploaderPort` (e.g. S3 SDK) and pass via `createDefaultFilesDeps({ uploader })` |
| Shared storage (backups)         | `@/shared/infrastructure/storage` via `STORAGE_PROVIDER` | Set `STORAGE_PROVIDER=s3` or implement `StorageProvider`                                   |
| Antivirus                        | `ClamAVScanner`                                          | Implement `ScannerPort` and pass `scanner` into `MinioUploader` config                     |
| Multipart / presigned            | MinIO client helpers                                     | Replace `MultipartService` / `PresignedUrlService`                                         |

Wire ClamAV into the singleton uploader in `infrastructure/config/minio.ts` when
ready:

```ts
import { ClamAVScanner } from '../scanner/clamav-scanner';

export const uploader = new MinioUploader({
  // ...
  scanner: new ClamAVScanner({ host: envs.CLAMAV_HOST, port: envs.CLAMAV_PORT }),
});
```

## Compatibility

- `src/services/upload/**` re-exports from this module.
- `src/middlewares/upload.ts` re-exports `upload` multer middleware.
- `src/controllers/users/_utils/avatar-uploader.ts` re-exports `uploadAvatar`.
