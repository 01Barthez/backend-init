/**
 * Mixed workload: public reads + authenticated reads + blog create/publish (when token set).
 * Simulates many concurrent active users with varied operations.
 *
 *   ACCESS_TOKEN=... k6 run tests/load/k6/scenarios/03-mixed-workload.js
 *   # Capacity run: raise MAX_* limits, clear Redis rl:* between scenarios
 *   # (see tests/load/k6/README.md)
 *   MAX_VUS=200 k6 run tests/load/k6/scenarios/03-mixed-workload.js
 */
import http from 'k6/http';
import { Counter } from 'k6/metrics';

import { API, BASE, jsonHeaders, okStatus, signupLogin, think } from '../lib/helpers.js';

const creates = new Counter('blog_creates');
const maxVus = Number(__ENV.MAX_VUS || 100);

export const options = {
  scenarios: {
    mixed: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: Math.min(40, maxVus) },
        { duration: '45s', target: Math.min(100, maxVus) },
        { duration: '45s', target: maxVus },
        { duration: '30s', target: maxVus },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.12'],
    // Mixed includes signup→SMTP which is slow under concurrency; track p99 loosely.
    http_req_duration: ['p(95)<5000', 'p(99)<20000'],
    checks: ['rate>0.85'],
  },
};

export function setup() {
  return { token: __ENV.ACCESS_TOKEN || '' };
}

export default function (data) {
  const roll = Math.random();

  if (roll < 0.35) {
    okStatus(http.get(`${BASE}/health`), 'health', [200]);
    okStatus(http.get(`${API}/blogs?page=1&limit=10`), 'blogs list', [200, 429]);
    think();
    return;
  }

  if (roll < 0.55) {
    okStatus(http.get(`${API}/blogs/search?q=load`), 'blogs search', [200, 429]);
    think();
    return;
  }

  if (roll < 0.7) {
    // Signup flood (unverified) — stress auth + mail path without OTP wait.
    signupLogin('mix');
    think(0.3, 0.9);
    return;
  }

  if (!data.token) {
    okStatus(http.get(`${BASE}/health/ready`), 'ready', [200, 503]);
    think();
    return;
  }

  const h = jsonHeaders(data.token);
  okStatus(http.get(`${API}/auth/me`, { headers: h }), 'me', [200, 401, 429]);

  if (roll > 0.9) {
    const title = `Load blog ${__VU}-${Date.now()}`;
    const create = http.post(
      `${API}/blogs`,
      JSON.stringify({ title, content: 'Load test body content', excerpt: 'load' }),
      { headers: h },
    );
    if (okStatus(create, 'blog create', [201, 403, 429])) {
      creates.add(1);
      try {
        const id = create.json('data.id');
        if (id && create.status === 201) {
          okStatus(
            http.patch(`${API}/blogs/${id}/publish`, null, { headers: h }),
            'blog publish',
            [200, 403, 429],
          );
        }
      } catch {
        /* ignore */
      }
    }
  }

  think(0.2, 0.7);
}
