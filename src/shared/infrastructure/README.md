# Shared Infrastructure

Cross-cutting technical adapters used by every module: database, cache, queue,
storage, mail, logging, metrics, and feature flags.

## Layout

```
infrastructure/
├── database/         # Prisma client
├── logging/          # Winston app + security loggers
├── cache/            # CachePort, Redis + LRU adapters
├── storage/          # StorageProvider port, MinIO / S3
├── mail/             # MailerPort, SMTP, EJS templates
├── queue/            # BullMQ queues + workers
├── metrics/          # Prometheus scrape endpoint
└── feature-flags/    # Flagsmith client
```

## Ports vs adapters

- `*.port.ts` files define interfaces the application layer may depend on.
- Concrete implementations (Prisma, Redis, Nodemailer, MinIO, …) live beside
  them.
- Prefer importing from each folder’s `index.ts` rather than deep paths.

## Configuration

All adapters read environment via `@/app/config` (`envs` / `config`). Do not
import the legacy `src/config/env/env.ts` from new code — that file is a shim.

## Dependency rules

```
modules/*  →  shared/infrastructure/*
shared/infrastructure  ✗→  modules/*   (forbidden once migrations complete)
```

Workers currently call a few legacy `src/services/*` handlers (backup,
maintenance, blacklist) until those domains move under `modules/`. Treat those
imports as temporary.
