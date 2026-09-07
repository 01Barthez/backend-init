# ADR 004: Process roles (api / worker / all)

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The template historically started HTTP and BullMQ workers in the same Node
process. That is convenient for local Compose, but a single replica cannot scale
HTTP independently of CPU-heavy backup/mail jobs, and a worker crash takes the
API with it.

Kubernetes-style sidecars and a service mesh would overfit a starter that still
ships as one image.

## Decision

Introduce `PROCESS_ROLE`:

| Value    | HTTP | Workers + repeatable jobs |
| -------- | ---- | ------------------------- |
| `all`    | yes  | yes                       |
| `api`    | yes  | no                        |
| `worker` | no   | yes                       |

Invalid values fall back to `all`. Default remains `all` so a fork still runs
from `npm run dev` without extra processes.

`createApp()` stays side-effect free (tests import it). `bootstrapApplication()`
and `app.listen` live in `src/index.ts`. Worker-only processes never bind a
port; Docker `HEALTHCHECK` on `/health/live` applies to API replicas only.

## Consequences

**Positive**

- Horizontal scale of API vs workers without splitting the codebase
- Fail-closed: workers exist before traffic is accepted (when role includes
  them)
- Graceful shutdown can skip HTTP drain when `server` is null

**Negative / trade-offs**

- Operators must not HEALTHCHECK a worker replica on `/health/live`
- Two replicas need a shared Redis and Mongo; this is already true for queues
