# Getting Started

Run Backend Init locally in minutes. Docker Compose is the recommended path.

## Prerequisites

| Tool                    | Version                              |
| ----------------------- | ------------------------------------ |
| Node.js                 | 20+                                  |
| npm                     | 10+                                  |
| Docker & Docker Compose | Recent stable                        |
| Bun (optional)          | Used by `npm run dev` for watch mode |

Git, and a copy of the repository.

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
- `JWT_*_KEY_PATH` (dev keys under `src/app/config/keys` or mounted paths)
- `COOKIE_EXPIRES_IN` (duration such as `7d`, not a tiny integer)
- `AUTH_ENCRYPTION_KEY` if you persist OAuth provider tokens
- OAuth provider variables you plan to exercise

Do not commit `.env`.

## Start infrastructure + app (recommended)

From the repository root:

```bash
npm install
npm run docker:up
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Compose is included via the root `docker-compose.yml` →
`infra/docker/docker-compose.yml`.

Useful URLs after boot:

| Surface       | URL                            |
| ------------- | ------------------------------ |
| API           | http://localhost:3000/api/v1   |
| Swagger UI    | http://localhost:3000/api-docs |
| Health        | http://localhost:3000/health   |
| Metrics       | http://localhost:3000/metrics  |
| MailHog       | http://localhost:8025          |
| MinIO console | http://localhost:9001          |
| Prisma Studio | http://localhost:5555 (dev)    |

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
