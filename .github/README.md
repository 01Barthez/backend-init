# GitHub configuration

This repository’s automation lives under `.github/`.

## Layout

```
.github/
├── README.md                 # This file
├── CODEOWNERS
├── dependabot.yml
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
│   ├── bug.yml
│   ├── feature.yml
│   ├── security.yml
│   └── config.yml
├── actions/
│   └── setup-node/           # Composite: Node + npm ci + Prisma generate
└── workflows/
    ├── ci.yml                # PR / push: lint → typecheck → tests → build
    ├── security.yml          # npm audit + Trivy (fs) + optional secret scan
    ├── codeql.yml            # GitHub CodeQL (JavaScript/TypeScript)
    ├── dependency-review.yml # PR dependency diff review
    ├── docker.yml            # Build & push image (GHCR by default)
    ├── release.yml           # GitHub Release on version tags
    └── deploy-vps.yml        # Deploy pulled image to a VPS (SSH)
```

## Pipeline overview

```
Pull Request / push
  ├── ci.yml            lint, typecheck, unit, integration, e2e, contract, coverage, build
  ├── dependency-review.yml
  ├── codeql.yml
  └── security.yml

Push to main (or version tag)
  ├── docker.yml        build → push GHCR (swap registry via secrets)
  ├── release.yml       on tags v*
  └── deploy-vps.yml    SSH pull & restart (optional; needs secrets)
```

## Required status checks (recommended)

In GitHub → Settings → Branches → Branch protection for `main`:

- `CI / validate`
- `Dependency Review`
- `CodeQL`

Mark them **required** before merge.

## Secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY` / `VPS_APP_PATH` | deploy-vps | SSH deploy |
| `CONTAINER_REGISTRY` | docker (optional) | Override default `ghcr.io` (e.g. Harbor) |
| `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` | docker (optional) | Non-GHCR registries |
| `SNYK_TOKEN` | optional | Not required; prefer native npm audit + CodeQL |

`GITHUB_TOKEN` is enough for GHCR pushes with `packages: write`.

## Switching registries / clouds

- **Harbor / Docker Hub / ECR**: set `CONTAINER_REGISTRY` + login secrets in `docker.yml`.
- **AWS / K8s later**: replace `deploy-vps.yml` with your CD job; keep `docker.yml` as the image producer.
