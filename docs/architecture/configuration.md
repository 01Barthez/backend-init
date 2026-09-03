# Configuration

All runtime settings flow through `src/app/config`. Modules must not call
`process.env` directly.

## Principles

1. **Single entry point** — import `config` from `@/app/config`.
2. **Fail fast** — values are validated at boot with `env-var` / dotenv-safe
   patterns. `validateRuntimeConfig()` additionally checks JWT PEMs, cookie TTL,
   and (in production) operator password + `AUTH_ENCRYPTION_KEY`.
3. **Grouped by concern** — consumers import only the slice they need
   (`config.auth`, `config.redis`, …).
4. **Immutable** — the exported `config` object is `Object.freeze`d.
5. **Documented** — every _consumed_ variable appears in `.env.example`.

## Layout

```
src/app/config/
├── env.ts                 # dotenv bootstrap + raw accessors
├── parse-duration.ts      # Human durations (`7d`) → milliseconds
├── validate-runtime.ts    # PEM / cookie / production operator checks
├── index.ts               # Aggregated frozen `config` + transitional `envs`
├── sections/
│   ├── app.ts             # Port, API prefix, PROCESS_ROLE, CORS, trust proxy
│   ├── database.ts        # DATABASE_URL, Mongo credentials
│   ├── auth.ts            # JWT PEM paths, expiries, OTP delay, cookies
│   ├── redis.ts           # Redis + TLS + local LRU cache
│   ├── storage.ts         # MinIO / S3 / ClamAV / upload caps
│   ├── mail.ts            # SMTP
│   ├── security.ts        # Rate limits, CSRF, CSP, Swagger, ADMIN_BASIC_*
│   ├── oauth.ts           # Provider client IDs / secrets / redirect URIs
│   ├── queue.ts           # Backup / maintenance / audit cron expressions
│   ├── features.ts        # Flagsmith, Infisical placeholders
│   └── observability.ts   # Loki, reserved OTEL flag
├── swagger.ts             # OpenAPI UI (Basic auth except tests)
└── README.md
```

JWT PEMs live at the **repository root** `keys/` (`JWT_*_KEY_PATH`). The folder
`src/app/config/keys/*.key` is leftover and unused.

## Usage

```ts
import { config } from '@/app/config';

const port = config.app.port;
const db = config.database.url;
const provider = config.storage.provider;
```

### Transitional `envs` mirror

`envs` is a flat, backward-compatible object mapped from `config`. Prefer
`config.*` in new code. Existing modules and workers may still use `envs` during
migration.

```ts
import { envs } from '@/app/config';

envs.REDIS_HOST;
envs.STORAGE_PROVIDER;
```

## Env groups (operators)

| Group         | Examples                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| Process       | `PROCESS_ROLE`, `TRUST_PROXY_HOPS`, `HTTP_REQUEST_TIMEOUT_MS`                                |
| CORS          | `CLIENT_URL`, `CLIENT_URLS`                                                                  |
| Redis         | `REDIS_TLS`, `REDIS_TLS_REJECT_UNAUTHORIZED`, `REDIS_USERNAME`                               |
| Operator auth | `ADMIN_BASIC_USER`, `ADMIN_BASIC_PASSWORD` (fallback `SWAGGER_*`)                            |
| Audit         | `AUDIT_PURGE_CRON`, `AUDIT_RETENTION_DAYS`                                                   |
| Uploads       | `API_UPLOAD_MAX_BYTES`, `PRESIGN_UPLOAD_MAX_BYTES`, `PRESIGN_TTL_SECONDS`, `CLAMAV_REQUIRED` |
| Observability | `LOKI_ENABLED`, `LOKI_HOST`, `OTEL_ENABLED` (reserved)                                       |
| Backup        | `BACKUP_CRON`, `BACKUP_ENCRYPTION_KEY`, `BACKUP_RETENTION_DAYS`, `BACKUP_ADMIN_EMAIL`        |

`LOG_LEVEL` and `LOG_TO_FILE` are parsed into `config.observability` but Winston
currently chooses level from `NODE_ENV` and writes rotating files whenever
`logs/` is writable. Do not treat those two variables as live controls yet.

## Adding a setting

1. Choose or create a section file under `sections/`.
2. Read with `env-var` (defaults and required flags as appropriate).
3. Attach the section on `config` in `index.ts`.
4. If legacy code needs the flat key, add a mapping on `envs`.
5. Update `.env.example` with a short comment (and `tests/setup/env.ts` when
   tests must supply the key for dotenv-safe).
6. Mention production implications in
   [production.md](../deployment/production.md) when the setting is
   security-sensitive.

## Secrets and keys

- JWT RS256 private/public keys are referenced by path (`JWT_PRIVATE_KEY_PATH`,
  refresh key paths, etc.). Generate with `npm run keys:generate`.
- In Docker/production, mount `keys/` as a read-only volume; do not bake private
  keys into images.
- OAuth client secrets, MinIO/S3 credentials, SMTP passwords, and backup
  encryption keys must come from the environment or a secret manager — never
  from committed files.

## Related

- Module README: `src/app/config/README.md`
- [Production deployment](../deployment/production.md)
- [ADR 003 — Dependency injection](./decisions/003-dependency-injection.md)
  (composition vs configuration)
- [ADR 005 — JWT keys outside the image](./decisions/005-jwt-keys-outside-image.md)
