# Infrastructure (`infra/`)

Operator-facing assets used by local Compose and VPS deploy. Application source
of truth remains under `src/`.

| Path                                     | Role                                       |
| ---------------------------------------- | ------------------------------------------ |
| `docker/Dockerfile`                      | Multi-stage Node 22 production image       |
| `docker/docker-compose.yml`              | Local full stack (included from repo root) |
| `docker/docker-compose.deploy.yml`       | CD pull-image stack (GHCR → VPS)           |
| `docker/docker-compose.prod.example.yml` | Hardened example (no MailHog, split roles) |
| `nginx/default.conf`                     | Edge routes: `/health*`, `/api/` only      |
| `scripts/`                               | Mongo init, MinIO init, start/stop helpers |
| `monitoring/clamav/`                     | Clamd config mounted into Compose          |

Docs: [Docker](../docs/deployment/docker.md) ·
[GitHub → VPS](../docs/deployment/github-vps.md) ·
[JWT keys](../docs/deployment/jwt-keys.md).
