# Docker

Infrastructure for Backend Init lives primarily under `infra/docker/`, included
from the repository root:

```yaml
# docker-compose.yml (root)
include:
  - path: infra/docker/docker-compose.yml
    env_file: .env
```

Generate JWT PEMs **before** the first `docker:up`:

```bash
npm run keys:generate
```

Compose mounts `../../keys:/app/keys:ro`. The image does **not** `COPY` PEMs; it
only creates an empty `/app/keys` directory. The Dockerfile copies
`docs/api/openapi.yaml` (runtime Swagger loader) and `.env.example`.

## Services (core profile)

| Service                | Role                                              |
| ---------------------- | ------------------------------------------------- |
| `backend`              | API image built from `infra/docker/Dockerfile`    |
| `mongo`                | MongoDB 6 (replica set helper script)             |
| `redis`                | Cache / BullMQ broker                             |
| `minio` + `minio-init` | S3-compatible object storage + bucket bootstrap   |
| `mailhog`              | Dev SMTP + UI                                     |
| `clamav`               | Antivirus daemon for upload scanning              |
| `nginx`                | Reverse proxy — public `/health` and `/api/` only |

The `backend` service defaults to `PROCESS_ROLE=all` from `.env` (HTTP + BullMQ
workers in one process). That remains the recommended local default.

### Process role split (`PROCESS_ROLE`)

| Value    | Behaviour                                             |
| -------- | ----------------------------------------------------- |
| `all`    | HTTP listen + register BullMQ workers (default)       |
| `api`    | HTTP only — skips `startWorkers()`                    |
| `worker` | Workers only — no HTTP listen (do not HEALTHCHECK it) |

Optional Compose profile **`split`** adds `backend-api` (`PROCESS_ROLE=api`) and
`backend-worker` (`PROCESS_ROLE=worker`). Enable with:

```bash
docker compose --profile split up -d backend-api backend-worker
# stop or scale down the default `backend` service when using split
```

Do not HEALTHCHECK a worker-only container on `/health` — it never listens.

### Production-oriented example

`infra/docker/docker-compose.prod.example.yml` is a **starting point** for
hardened deploys (not wired into the root Compose include):

- No host ports for **mongo / redis / minio / clamav** (compose network only)
- **`PROCESS_ROLE` split** (`backend-api` + `backend-worker`) — no combined
  `all`
- **No MailHog** — configure real `SMTP_*` in `.env`
- Nginx publishes HTTP; terminate TLS at the load balancer

```bash
docker compose -f infra/docker/docker-compose.prod.example.yml --env-file .env up -d
```

Adapt healthchecks, SMTP, and secrets for your environment before using it.

Dockerfile `HEALTHCHECK` hits `http://localhost:3000/health/live` (process up).
Use `/health/ready` for dependency probes (Mongo + Redis).

### Tools profile (`profiles: [tools]`)

| Service         | Role                                                                               |
| --------------- | ---------------------------------------------------------------------------------- |
| `mongo-backup`  | Periodic `mongodump` into `infra/docker/backups`                                   |
| `redisinsight`  | Redis UI                                                                           |
| `prisma-studio` | Prisma data browser on `:5555` (dev only — not for production)                     |
| `flagsmith`     | Feature-flag UI + API on `:8000` (see [feature flags](../guides/feature-flags.md)) |
| `flagsmith-db`  | Postgres for Flagsmith (tools only)                                                |

Prefer the host script when the API runs outside Compose:

```bash
npm run prisma:studio
```

```bash
npm run docker:tools
# or
docker compose --profile tools up -d
```

Monitoring (Prometheus, Grafana, Loki, Alertmanager) is composed separately
under `infra/docker/docker-compose.monitoring.yml` and `infra/monitoring/`. See
[Observability](./observability.md).

## Nginx public surface

`infra/nginx/default.conf` publishes **only**:

| Location  | Notes                                                |
| --------- | ---------------------------------------------------- |
| `/health` | Probes (includes `/health/live` and `/health/ready`) |
| `/api/`   | Versioned REST                                       |

Everything else (including `/metrics`, `/api-docs`, `/admin`) returns **404**.
Scrape Prometheus and open operator UIs against `backend:3000` on
`backend_network`, not through port 80.

**TLS:** Compose publishes **port 80 only**. Terminate TLS at your load balancer
(ALB, Cloudflare, Caddy, etc.). To terminate inside Nginx, mount certificates,
add an `ssl` server block to `infra/nginx/default.conf`, and uncomment the
`:443` port mapping in `infra/docker/docker-compose.yml`.

**ClamAV:** The backend `depends_on` waits for ClamAV healthy. First boot can
take 1–5 minutes while signatures download. If you do not need AV scanning,
remove the `clamav` dependency (and service) from Compose. With
`CLAMAV_REQUIRED=false`, the API degrades gracefully at runtime once started.

`client_max_body_size 2m` — avatars via the API. Large objects use
`POST /api/v1/files/presign` then PUT directly to MinIO.

**JWT keys in Docker:** the image runs as the official `node` user (UID 1000),
so host-owned `keys/*.pem` (`chmod 600`) remain readable when mounted read-only.

## Common commands

```bash
npm run docker:up          # start stack
npm run docker:ps          # status
npm run docker:rebuild     # rebuild backend image without cache, recreate container
npm run docker:down        # stop stack
```

Rebuild after Dockerfile or dependency changes:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

## Volumes

Named volumes (see Compose file) typically include:

- `mongo_data` — database files
- `mongo_keyfile` — replica set keyfile
- `minio_data` — object storage
- `clamav_data` / `clamav_logs` — virus DB and logs
- `redisinsight_data` — UI state (tools profile)

Bind mounts of note:

- `../scripts/start-mongo.sh` into the mongo container
- `../scripts/init-minio.sh` for bucket initialization
- `../nginx/default.conf` into nginx
- `../../keys` into the API container at `/app/keys` (read-only)
- `./backups` for the optional mongo-backup tool

## Networking

Services share `backend_network`. Inside Compose, the API should use hostnames
`mongo`, `redis`, `minio`, `mailhog`, `clamav`. The `backend` service overrides
`DATABASE_URL` and several ports for in-network addressing.

When running the API on the host against Compose dependencies, use `127.0.0.1`
and published ports instead.

## Scripts

`infra/scripts/` orchestrates Compose stacks (`full_start.sh`, `full_stop.sh`,
`start_monitoring.sh`, …). They do **not** set `PROCESS_ROLE` inside Node — that
comes from `.env` / the process environment. Prefer documented npm scripts for
everyday use.

## Related

- [Getting started](../development/getting-started.md)
- [Production](./production.md)
- [JWT keys](./jwt-keys.md)
