# Getting Started

Run Backend Init locally in minutes. Docker Compose is the recommended path.

## Prerequisites

| Tool                    | Version       |
| ----------------------- | ------------- |
| Node.js                 | 20+           |
| npm                     | 10+           |
| Docker & Docker Compose | Recent stable |

Git, and a copy of the repository. `npm run dev` uses **tsx watch** (not Bun).

## Clone

```bash
git clone https://github.com/barthez-kenwou/backend-init.git
cd backend-init
```

## Environment

```bash
cp .env.example .env
```

Review at least:

- `DATABASE_URL`, `MONGO_*`
- `REDIS_HOST` / `REDIS_PORT`
- `MINIO_*` or `S3_*` + `STORAGE_PROVIDER`
- `JWT_*_KEY_PATH` — after `npm run keys:generate`, these default to
  `keys/jwt-access-*.pem` and `keys/jwt-refresh-*.pem` at the **repository
  root** (not `src/app/config/keys`)
- `COOKIE_EXPIRES_IN` (duration such as `7d`, not a tiny integer)
- `AUTH_ENCRYPTION_KEY` — required in production; needed locally if you persist
  OAuth tokens or use TOTP
- `PROCESS_ROLE` (`all` / `api` / `worker`)
- `TRUST_PROXY_HOPS` (set `1` behind Nginx)
- `CLIENT_URL` / `CLIENT_URLS` (CORS allowlist)
- `ADMIN_BASIC_PASSWORD` — operator UIs; in development, empty falls back to
  `SWAGGER_PASSWORD`
- OAuth provider variables you plan to exercise

Missing or empty JWT PEMs abort boot (`validateRuntimeConfig`). Do not commit
`.env`.

## Start infrastructure + app (recommended)

From the repository root:

```bash
npm install
npm run keys:generate
npm run docker:up
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Split processes when you want to mimic production:

```bash
npm run dev:api      # PROCESS_ROLE=api — HTTP only
npm run dev:worker   # PROCESS_ROLE=worker — BullMQ only, no listen
```

Compose is included via the root `docker-compose.yml` →
`infra/docker/docker-compose.yml`.

Useful URLs after boot (hit the **API port**, not Nginx, for operator UIs):

| Surface       | URL                                | Notes                                      |
| ------------- | ---------------------------------- | ------------------------------------------ |
| API           | http://localhost:3000/api/v1       | Versioned REST                             |
| Swagger UI    | http://localhost:3000/api-docs     | HTTP Basic (`ADMIN_BASIC_*` / `SWAGGER_*`) |
| Health        | http://localhost:3000/health       | Mongo + Redis                              |
| Metrics       | http://localhost:3000/metrics      | HTTP Basic (except `NODE_ENV=test`)        |
| Bull Board    | http://localhost:3000/admin/queues | Basic + JWT admin                          |
| MailHog       | http://localhost:8025              | Dev SMTP UI                                |
| MinIO console | http://localhost:9001              | Object storage UI                          |
| Prisma Studio | http://localhost:5555              | Dev only                                   |

Through Nginx (`localhost:80`) only `/health` and `/api/` are published.
`/metrics`, `/api-docs`, and `/admin` are 404 at the edge.

Browse Mongo collections locally (Mongo must be up, port published):

```bash
npm run prisma:studio
```

Optional tooling profile (Prisma Studio, RedisInsight, mongo-backup loop):

```bash
npm run docker:tools
```

Full stack helpers also live under `infra/scripts/` (e.g.
`./infra/scripts/full_start.sh`).

## Local development without Docker for the API process

Keep MongoDB and Redis reachable (Compose for deps only is fine), then:

```bash
npm install
npm run keys:generate
npm run prisma:generate
npm run prisma:push
npm run dev
```

Point `DATABASE_URL` / `REDIS_HOST` at your local services. When the API runs on
the host and Redis runs in Compose, `REDIS_HOST` is often `127.0.0.1` rather
than `redis`.

## Verify

```bash
curl -s http://localhost:3000/health
npm test
npm run validate
```

## Next steps

- [Architecture overview](../architecture/overview.md)
- [Contributing](./contributing.md)
- [Authentication guide](../guides/authentication.md)
- [Docker details](../deployment/docker.md)
- [Production](../deployment/production.md)
