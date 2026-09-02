# Configuration

All runtime settings flow through `src/app/config`. Modules must not call
`process.env` directly.

## Principles

1. **Single entry point** — import `config` from `@/app/config`.
2. **Fail fast** — values are validated at boot with `env-var` / dotenv-safe
   patterns.
3. **Grouped by concern** — consumers import only the slice they need
   (`config.auth`, `config.redis`, …).
4. **Immutable** — the exported `config` object is `Object.freeze`d.
5. **Documented** — every variable appears in `.env.example`.

## Layout

```
src/app/config/
├── env.ts                 # dotenv bootstrap + raw accessors
├── parse-duration.ts      # Human durations (`7d`) → milliseconds
├── index.ts               # Aggregated frozen `config` + transitional `envs`
├── sections/
│   ├── app.ts             # Port, API prefix, name, URLs, locale
│   ├── database.ts        # DATABASE_URL, Mongo credentials
│   ├── auth.ts            # JWT paths, expiries, OTP delay, cookies
│   ├── redis.ts           # Redis + local LRU cache
│   ├── storage.ts         # MinIO / S3 / ClamAV
│   ├── mail.ts            # SMTP
│   ├── security.ts        # Rate limits, CSRF, CSP, Swagger basic auth
│   ├── oauth.ts           # Provider client IDs / secrets / redirect URIs
│   ├── queue.ts           # Backup / maintenance cron expressions
│   ├── features.ts        # Flagsmith, Infisical placeholders
│   └── observability.ts   # Log level, Loki, file logging
├── keys/                  # Local JWT RSA material (dev); mount secrets in prod
├── swagger.ts              # OpenAPI UI mounting
└── README.md
```

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

## Adding a setting

1. Choose or create a section file under `sections/`.
2. Read with `env-var` (defaults and required flags as appropriate).
3. Attach the section on `config` in `index.ts`.
4. If legacy code needs the flat key, add a mapping on `envs`.
5. Update `.env.example` with a short comment.
6. Mention production implications in
   [production.md](../deployment/production.md) when the setting is
   security-sensitive.

## Secrets and keys

- JWT RS256 private/public keys are referenced by path (`JWT_PRIVATE_KEY_PATH`,
  refresh key paths, etc.).
- In Docker/production, mount keys as read-only volumes; do not bake private
  keys into images.
- OAuth client secrets, MinIO/S3 credentials, SMTP passwords, and backup
  encryption keys must come from the environment or a secret manager — never
  from committed files.

## Related

- Module README: `src/app/config/README.md`
- [Production deployment](../deployment/production.md)
- [ADR 003 — Dependency injection](./decisions/003-dependency-injection.md)
  (composition vs configuration)
