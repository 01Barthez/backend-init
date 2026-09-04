# Load tests (k6)

Scenarios live under `tests/load/k6/scenarios/`. They hit a **running** API (Docker or local).

## Prerequisites

- API healthy on `BASE_URL` (default `http://127.0.0.1:3000`)
- [k6](https://k6.io/docs/get-started/installation/) (`k6 version`)
- For capacity runs, raise rate limits so you measure the app — not the limiter:

```bash
MAX_GLOBAL_QUERY_NUMBER=100000 MAX_UNIQ_QUERY_NUMBER=100000 MAX_AUTH_QUERY_NUMBER=20000 \
  docker compose -f infra/docker/docker-compose.yml up -d --force-recreate --no-deps backend

# Reset the sliding window between scenarios (shared IP budget fills fast):
docker exec BACKEND_CACHE sh -c "redis-cli --scan --pattern 'rl:*' | xargs -r redis-cli DEL"
```

Restore normal limits after the run (compose defaults / `.env`).
`npm run test:load` does elevate → flush → run → restore for you.

## Scenarios

| Script | Purpose |
|--------|---------|
| `01-public-health.js` | Smoke + ramp on `/health` and public blogs |
| `02-auth-session.js` | Concurrent authenticated reads (`ACCESS_TOKEN` required) |
| `03-mixed-workload.js` | Mixed public / signup / auth / blog writes |

```bash
# Public baseline
k6 run tests/load/k6/scenarios/01-public-health.js

# Authenticated (obtain token via login after verify)
ACCESS_TOKEN='…' k6 run tests/load/k6/scenarios/02-auth-session.js

# Mixed (optional token for write path)
ACCESS_TOKEN='…' MAX_VUS=150 k6 run tests/load/k6/scenarios/03-mixed-workload.js

# Or via npm
npm run test:load
```

## Thresholds

Scripts fail if error rate or p95 latency exceeds configured thresholds. Tune env:

- `BASE_URL` — API origin
- `ACCESS_TOKEN` — Bearer for auth scenarios
- `MAX_VUS` — peak VUs for mixed scenario

## Interpreting 429s

With production-like `MAX_*` values, some 429 responses are expected under heavy load. Capacity tests should use elevated limits; soak tests can keep production limits and treat 429 as a valid protection signal (adjust thresholds / checks accordingly).
