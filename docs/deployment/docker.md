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

The `backend` service defaults to `PROCESS_ROLE=all` from `.env`. For a split
deployment, run two replicas (`api` and `worker`). Do not HEALTHCHECK a
worker-only container on `/health` — it never listens.

Dockerfile `HEALTHCHECK` hits `http://localhost:3000/health` (Mongo + Redis).

### Tools profile (`profiles: [tools]`)

| Service         | Role                                                           |
| --------------- | -------------------------------------------------------------- |
| `mongo-backup`  | Periodic `mongodump` into `infra/docker/backups`               |
| `redisinsight`  | Redis UI                                                       |
| `prisma-studio` | Prisma data browser on `:5555` (dev only — not for production) |

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

`client_max_body_size 2m` — avatars via the API. Large objects use
`POST /api/v1/files/presign` then PUT directly to MinIO.

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
- [JWT keys](../../keys/README.md)
