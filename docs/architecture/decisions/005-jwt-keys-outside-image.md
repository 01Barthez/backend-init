# ADR 005: JWT keys outside the image

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

RS256 requires four PEM files (access + refresh, private + public). Baking them
into the Docker image (or committing PEMs under application source trees) means
every clone and every registry pull shares the same signing material.

## Decision

- Generate PEMs with `npm run keys:generate` (`scripts/generate-jwt-keys.sh`)
  into gitignored `keys/*.pem` at the **repository root** (single source of
  truth).
- Default env paths: `keys/jwt-access-*.pem` and `keys/jwt-refresh-*.pem`.
- Dockerfile creates an empty `/app/keys` directory and **never** `COPY`s PEMs.
- Compose mounts `./keys:/app/keys:ro`.
- `validateRuntimeConfig()` aborts if a path is missing or empty.
- Do not store key material under `src/app/config/`.

## Consequences

**Positive**

- Images are not secretly signed with the author's keys
- Rotation is a host/secret-manager change, not a rebuild
- CI generates ephemeral keys per run

**Negative / trade-offs**

- First boot requires an extra command (`keys:generate`)
- Operators must mount secrets in every environment
