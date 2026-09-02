# Storage Providers

Object storage appears in two related places:

| Concern                                              | Location                          | Default                      |
| ---------------------------------------------------- | --------------------------------- | ---------------------------- |
| Shared storage (backups, bucket ensure, raw put/get) | `@/shared/infrastructure/storage` | MinIO via `STORAGE_PROVIDER` |
| Validated user uploads (avatars, documents)          | `@/modules/files`                 | `MinioUploader` + providers  |

## Shared storage — MinIO vs S3

Config section: `config.storage` (`src/app/config/sections/storage.ts`).

```bash
STORAGE_PROVIDER=minio   # default
# or
STORAGE_PROVIDER=s3
```

The facade in `storage.service.ts` selects:

- `MinioStorageProvider` when provider ≠ `s3`
- `S3StorageProvider` when `STORAGE_PROVIDER=s3`

Set the corresponding credential block in `.env`:

- MinIO: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`,
  buckets / public URL
- S3: `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_ENDPOINT`,
  …

Application code should call `storageService` (ensure buckets, upload helpers)
rather than constructing SDK clients ad hoc.

## Files module uploads

User-facing validated uploads implement `UploaderPort` (and optional
`ScannerPort` for ClamAV). Swapping upload backends:

1. Implement `UploaderPort` (for example with the AWS SDK).
2. Pass it through `createDefaultFilesDeps({ uploader })` or wire it in the
   files module defaults.
3. Keep Multer middleware (`upload`) at the HTTP edge; keep virus scanning
   optional but recommended.

ClamAV host/port come from `config.storage.clamav`.

## When to use which

- **Backup module / ops dumps** → shared storage facade + `STORAGE_PROVIDER`.
- **Signup/profile avatars and user files** → files module uploader.
- Do not duplicate bucket bootstrap logic inside domain modules.

## Related

- [Modules — files](../architecture/modules.md)
- Files README: `src/modules/files/README.md`
- [Background jobs](./background-jobs.md) (backup uploads)
