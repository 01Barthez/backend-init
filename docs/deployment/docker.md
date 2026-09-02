# Docker

Infrastructure for Backend Init lives primarily under `infra/docker/`, included
from the repository root:

```yaml
# docker-compose.yml (root)
include:
  - path: infra/docker/docker-compose.yml
    env_file: .env
```

## Services (core profile)

| Service                | Role                                            |
| ---------------------- | ----------------------------------------------- |
| `backend`              | API image built from `infra/docker/Dockerfile`  |
| `mongo`                | MongoDB 6 (replica set helper script)           |
| `redis`                | Cache / BullMQ broker                           |
| `minio` + `minio-init` | S3-compatible object storage + bucket bootstrap |
| `mailhog`              | Dev SMTP + UI                                   |
| `clamav`               | Antivirus daemon for upload scanning            |
| `nginx`                | Reverse proxy in front of the API               |

### Tools profile (`profiles: [tools]`)

| Service        | Role                                             |
| -------------- | ------------------------------------------------ |
| `mongo-backup` | Periodic `mongodump` into `infra/docker/backups` |
| `redisinsight` | Redis UI                                         |

```bash
npm run docker:tools
# or
docker compose --profile tools up -d
```

Monitoring (Prometheus, Grafana, Loki, Alertmanager) is composed separately
under `infra/docker/docker-compose.monitoring.yml` and `infra/monitoring/`. See
[Observability](./observability.md).

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
- `./backups` for the optional mongo-backup tool

## Networking

Services share `backend_network`. Inside Compose, the API should use hostnames
`mongo`, `redis`, `minio`, `mailhog`, `clamav`. The `backend` service overrides
`DATABASE_URL` and several ports for in-network addressing.

When running the API on the host against Compose dependencies, use `127.0.0.1`
and published ports instead.

## Scripts

`infra/scripts/` provides higher-level helpers (`full_start.sh`, `full_stop.sh`,
`start_monitoring.sh`, …). Prefer documented npm scripts for everyday use; use
shell scripts for full stack / monitoring orchestration.

## Related

- [Getting started](../development/getting-started.md)
- [Production](./production.md)
