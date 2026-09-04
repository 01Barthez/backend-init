# Application Configuration

Centralized, typed configuration for the entire backend.

## Principles

1. **Never** read `process.env` outside this folder.
2. Every setting is validated at boot via `env-var` — fail fast on
   misconfiguration. `validate-runtime.ts` checks JWT PEMs and production
   operator secrets.
3. Settings are grouped by concern (`app`, `database`, `auth`, `redis`, …) so
   modules import only what they need.
4. The public surface is `config` (from `@/app/config`) — a frozen, immutable
   object.

## Layout

```
config/
├── env.ts                 # dotenv bootstrap + raw env accessors
├── parse-duration.ts      # `7d` / `15m` / ms → number for cookie / CSRF TTL
├── validate-runtime.ts    # PEM presence, cookie TTL, production guards
├── index.ts               # Aggregated `config` export
├── sections/              # One file per concern
│   ├── app.ts             # PROCESS_ROLE, TRUST_PROXY_HOPS, CLIENT_URLS, …
│   ├── database.ts
│   ├── auth.ts            # JWT_*_KEY_PATH → repo-root keys/*.pem
│   ├── redis.ts           # REDIS_TLS
│   ├── storage.ts         # ClamAV + API/presign byte caps
│   ├── mail.ts
│   ├── security.ts        # ADMIN_BASIC_* , Swagger
│   ├── oauth.ts
│   ├── queue.ts           # backup + audit purge crons
│   ├── features.ts
│   └── observability.ts   # LOKI_HOST, OTEL_ENABLED (reserved)
├── swagger.ts
└── README.md
```

Do not put RSA material under `src/app/config/`. Runtime paths are
`keys/jwt-*.pem` at the repository root (`npm run keys:generate`).

## Usage

```ts
import { config } from '@/app/config';

config.app.port;
config.app.processRole;
config.database.url;
config.auth.jwt.accessExpiresIn;
config.storage.provider;
```

## Extending

1. Add a typed section under `sections/`.
2. Register it in `index.ts`.
3. Document the new variables in `.env.example` and, when tests load dotenv-safe
   against a full example file, in `tests/setup/env.ts`.
