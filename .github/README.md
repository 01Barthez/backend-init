# GitHub configuration

This repository’s automation lives under `.github/`.

## Layout

```
.github/
├── README.md
├── CODEOWNERS
├── dependabot.yml
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
├── actions/setup-node/       # Node + npm ci + Prisma generate
└── workflows/
    ├── ci.yml                # lint → typecheck → tests → audit → build
    ├── security.yml          # npm audit, Trivy, OSV, gitleaks, ESLint security
    ├── codeql.yml            # CodeQL SAST
    ├── dependency-review.yml # PR dependency diff
    ├── docker.yml            # Build & push image (GHCR by default)
    ├── release.yml           # GitHub Release on v* tags
    └── deploy-vps.yml        # SSH pull image + compose up (OVH / any VPS)
```

## Pipeline flow

```
PR / push
  ├── ci.yml
  ├── security.yml
  ├── codeql.yml
  └── dependency-review.yml (PR only)

Push to main (or v* tag)
  └── docker.yml  →  GHCR image tags: main, latest, sha-<full>, semver

After Docker succeeds on main
  └── deploy-vps.yml  →  SSH → docker compose pull/up → health check
```

Human checklist for secrets / Environments / package visibility:
**[guide-github-config.md](../guide-github-config.md)** (repo root).

## Required status checks (recommended)

Settings → Branches → protect `main`:

- `CI / validate`
- `Dependency Review`
- `CodeQL`

## Secrets & variables (summary)

| Name                                                  | Type                                     | Used by                             |
| ----------------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_PATH` | Environment `production` secrets         | deploy-vps                          |
| `GHCR_USERNAME`, `GHCR_PULL_TOKEN`                    | Environment secrets (if package private) | deploy-vps                          |
| `DEPLOY_HEALTH_URL`                                   | Variable (repo or environment)           | deploy-vps health probe             |
| `CONTAINER_REGISTRY`                                  | Variable (optional)                      | docker / deploy (default `ghcr.io`) |
| `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`              | Secrets (non-GHCR only)                  | docker                              |

App runtime `.env` (Mongo, JWT paths, SMTP, MinIO, …) lives **on the VPS**, not
in GitHub Actions.

## Image contract

- Name: `ghcr.io/<owner>/<repo>` (**lowercase**)
- Tags on `main`: `main`, `latest`, `sha-<40-char-commit>`
- Deploy after Docker uses the immutable `sha-<head_sha>` from the Docker run
- VPS: repo checkout at `VPS_APP_PATH`; compose
  `infra/docker/docker-compose.deploy.yml` + **root** `.env` only
