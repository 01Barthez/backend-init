# Shared Infrastructure

Cross-cutting technical adapters used by every module: database, cache, queue,
storage, mail, logging, metrics, feature flags, audit, locks, search, HTTP
client, request context, and process lifecycle.

## Layout

```
infrastructure/
├── database/         # Prisma client
├── logging/          # Winston app + security loggers
├── cache/            # CachePort, Redis + LRU adapters
├── storage/          # StorageProvider port, MinIO / S3
├── mail/             # MailerPort, SMTP, EJS templates
├── queue/            # BullMQ queues + workers
├── metrics/          # Prometheus scrape endpoint (Basic auth)
├── feature-flags/    # Flagsmith client
├── audit/            # AuditPort + Prisma AuditLog
├── lock/             # Redis distributed locks for crons
├── search/           # SearchPort (Mongo contains adapter)
├── request-context/  # AsyncLocalStorage (request id, user, traceparent)
├── http/             # createSafeHttpClient
├── lifecycle/        # graceful shutdown
└── maintenance/      # unverified-user purge helpers
```

## Ports vs adapters

- `*.port.ts` files define interfaces the application layer may depend on.
- Concrete implementations (Prisma, Redis, Nodemailer, MinIO, …) live beside
  them.
- Prefer importing from each folder’s `index.ts` rather than deep paths.

## Configuration

All adapters read environment via `@/app/config` (`envs` / `config`). Never
`process.env` here.

## Dependency rules

```
modules/*  →  shared/infrastructure/*
shared/infrastructure  ✗→  modules/*
```

Workers (composition) import public module APIs such as `@/modules/backup` and
auth blacklist purge. That is allowed from `queue/workers.ts` as the process
composition root for background work — not from domain or random adapters.
