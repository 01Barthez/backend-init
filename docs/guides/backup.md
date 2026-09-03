# Backups

Nightly Mongo dump (BullMQ) encrypts the archive with AES-256-GCM and uploads it
to the backups bucket.

## Encryption

- Key: `BACKUP_ENCRYPTION_KEY`
- Layout: `salt (16) || iv (16) || ciphertext || authTag (16)`
- Salt is random per run (not a hardcoded string)
- Streaming — the dump is not fully loaded into memory before encrypt

## Scheduling

Registered only when `PROCESS_ROLE` is `all` or `worker`, and Flagsmith
`enable_backup` is on (default true). Overlap is prevented with a Redis lock.

Retention is `BACKUP_RETENTION_DAYS` (object lifecycle is operator-owned).

## Restore (ops)

Decrypt with the same key, then `mongorestore --gzip --archive=...`. Keep the
key in a secret manager; losing it means losing the backups.
