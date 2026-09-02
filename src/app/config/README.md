# Application Configuration

Centralized, typed configuration for the entire backend.

## Principles

1. **Never** read `process.env` outside this folder.
2. Every setting is validated at boot via `env-var` — fail fast on
   misconfiguration.
3. Settings are grouped by concern (`app`, `database`, `auth`, `redis`, …) so
   modules import only what they need.
4. The public surface is `config` (from `@/app/config`) — a frozen, immutable
   object.

## Layout

```
config/
├── env.ts                 # dotenv bootstrap + raw env accessors
├── index.ts               # Aggregated `config` export
├── sections/              # One file per concern
│   ├── app.ts
│   ├── database.ts
│   ├── auth.ts
│   ├── redis.ts
│   ├── storage.ts
│   ├── mail.ts
│   ├── security.ts
│   ├── oauth.ts
│   ├── queue.ts
│   ├── features.ts
│   └── observability.ts
├── keys/                  # JWT RSA key material (never commit secrets in prod)
└── README.md
```

## Usage

```ts
import { config } from '@/app/config';

config.app.port;
config.database.url;
config.auth.jwt.accessExpiresIn;
config.storage.provider;
```

## Extending

1. Add a typed section under `sections/`.
2. Register it in `index.ts`.
3. Document the new variables in `.env.example`.
