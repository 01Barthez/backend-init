/**
 * Public / probe endpoints — baseline latency under rising VUs.
 *
 *   k6 run tests/load/k6/scenarios/01-public-health.js
 *   k6 run -e BASE_URL=http://127.0.0.1:3000 tests/load/k6/scenarios/01-public-health.js
 */
import http from 'k6/http';
import { Trend } from 'k6/metrics';

import { API, BASE, okStatus, think } from '../lib/helpers.js';

const healthTrend = new Trend('health_duration', true);

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '20s',
      startTime: '0s',
      tags: { stage: 'smoke' },
    },
    ramp: {
      executor: 'ramping-vus',
      startTime: '20s',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '20s', target: 0 },
      ],
      tags: { stage: 'ramp' },
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  healthTrend.add(health.timings.duration);
  okStatus(health, 'GET /health', [200]);

  const live = http.get(`${BASE}/health/live`);
  okStatus(live, 'GET /health/live', [200]);

  const ready = http.get(`${BASE}/health/ready`);
  okStatus(ready, 'GET /health/ready', [200, 503]);

  const blogs = http.get(`${API}/blogs?page=1&limit=10`);
  okStatus(blogs, 'GET /blogs', [200, 429]);

  think(0.1, 0.4);
}
