# GitHub → GHCR → VPS deploy

Operational checklist for this template: GitHub Actions builds the image, pushes
to GHCR, then SSHs to a VPS and runs
[`docker-compose.deploy.yml`](../../infra/docker/docker-compose.deploy.yml).

> Companion to [production.md](./production.md) (app runtime) and
> [`.github/WORKFLOWS.md`](../../.github/WORKFLOWS.md) (workflow inventory).

## Flow

```text
Push to main
    │
    ▼
docker.yml     build Dockerfile → push GHCR
               tags: main | latest | sha-<full40>
    │
    ▼
deploy-vps.yml SSH → git pull (checkout) → compose pull/up
               local /health/live probe (authoritative)
```

**Two secret worlds (do not mix):**

| World           | Where                                      | Examples                                        |
| --------------- | ------------------------------------------ | ----------------------------------------------- |
| **CI / CD**     | GitHub Environment `production`            | `VPS_SSH_KEY`, `GHCR_PULL_TOKEN`                |
| **Runtime app** | Root `.env` on the VPS (+ Infisical later) | `DATABASE_URL`, `SMTP_*`, `AUTH_ENCRYPTION_KEY` |

Actions never inject the app `.env` into the image.

## Environment `production`

**Settings → Environments → `production`**

Deploy job uses `environment: production` — keep VPS secrets **only** here.

### Secrets (required)

| Secret         | Purpose                                |
| -------------- | -------------------------------------- |
| `VPS_HOST`     | SSH host / IP                          |
| `VPS_USER`     | SSH user (docker group preferred)      |
| `VPS_SSH_KEY`  | Private key PEM                        |
| `VPS_APP_PATH` | Absolute path to **git checkout** root |
| `VPS_SSH_PORT` | Optional; default `22`                 |

### Secrets (if GHCR package is private)

| Secret            | Purpose                     |
| ----------------- | --------------------------- |
| `GHCR_USERNAME`   | `docker login ghcr.io` user |
| `GHCR_PULL_TOKEN` | PAT with `read:packages`    |

### Variables

| Variable             | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `CONTAINER_REGISTRY` | Default `ghcr.io`                                          |
| `DEPLOY_HEALTH_URL`  | Optional public URL; **local** container probe is required |

Public HTTPS probes often fail under Cloudflare bot challenges; the workflow
treats them as warnings.

## VPS checkout (once)

```bash
sudo mkdir -p /srv/internal && sudo chown "$USER:$USER" /srv/internal
cd /srv/internal
git clone git@github.com:<owner>/backend-init.git backend-init
cd backend-init
cp .env.example .env   # set production values — real SMTP, not MailHog
npm ci && npm run keys:generate
# PEMs only as UID 1000 (container user). Do NOT chown -R keys/ to 1000.
sudo chown 1000:1000 keys/*.pem
sudo chmod 600 keys/*-private.pem
sudo chmod 644 keys/*-public.pem
sudo chown "$USER:$USER" keys

# Network shared with Nginx Proxy Manager (or equivalent)
docker network create web-proxy 2>/dev/null || true
```

`VPS_APP_PATH` must be this directory (contains `.env`, `keys/`, `infra/`).

See [jwt-keys.md](./jwt-keys.md) for permission details.

## Compose used by CD

File: `infra/docker/docker-compose.deploy.yml`

- Pulls `IMAGE_REF` (set by the workflow into `.env.image`)
- Single env source: **repo-root** `.env`
- Services: `backend-api` + `backend-worker` + mongo/redis/minio/clamav/nginx
- **No host `:80`** on nginx — edge proxy (NPM) already owns 80/443
- External network **`web-proxy`** (must exist before `compose up`)

```bash
# Manual smoke on the VPS
export IMAGE_REF=ghcr.io/<owner>/backend-init:main
printf 'IMAGE_REF=%s\n' "$IMAGE_REF" > .env.image
docker compose -f infra/docker/docker-compose.deploy.yml \
  --env-file .env --env-file .env.image up -d
```

### Nginx Proxy Manager

1. Attach target to `web-proxy` (compose already joins `nginx`; or connect
   `Backend-Init-http` manually).
2. Proxy host → `BACKEND_NGINX:80` **or** `Backend-Init-http:3000`.
3. Cloudflare SSL mode **Full** (not Flexible).
4. Bot Fight may 403 `curl` to the public URL — use a browser or allowlist.

## Fail-closed production `.env` (minimum)

| Variable                | Rule                               |
| ----------------------- | ---------------------------------- |
| `NODE_ENV`              | `production`                       |
| `ADMIN_BASIC_PASSWORD`  | Non-empty, ≠ `admin`               |
| `AUTH_ENCRYPTION_KEY`   | Non-empty                          |
| `ALLOW_CSRF_PROTECTION` | `true`                             |
| `COOKIE_SECURE`         | `true`                             |
| `CLAMAV_REQUIRED`       | `true`                             |
| `BACKUP_ENCRYPTION_KEY` | Non-placeholder                    |
| `REDIS_TLS`             | `false` for Compose Redis (no TLS) |
| `MINIO_USE_SSL`         | `false` for internal MinIO         |
| `SMTP_*`                | Real provider (not `mailhog`)      |
| `LOKI_ENABLED`          | `false` unless Loki is deployed    |
| `SWAGGER_ENABLED`       | Prefer `false` on public hosts     |

## Related

- [Docker](./docker.md) — local Compose + tools profile
- [Production](./production.md) — runtime hardening
- [Security scanning](./security-scanning.md)
- [JWT keys](./jwt-keys.md)
