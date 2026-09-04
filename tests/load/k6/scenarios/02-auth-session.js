/**
 * Authenticated session loop: /auth/me + /auth/sessions + /blogs list.
 * Requires a verified ACCESS_TOKEN (from a prior login).
 *
 *   ACCESS_TOKEN=... k6 run tests/load/k6/scenarios/02-auth-session.js
 */
import http from 'k6/http';
import { API, jsonHeaders, okStatus, think } from '../lib/helpers.js';

const token = __ENV.ACCESS_TOKEN || '';

export const options = {
  scenarios: {
    steady: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 75 },
        { duration: '30s', target: 75 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.08'],
    http_req_duration: ['p(95)<1200'],
    checks: ['rate>0.90'],
  },
};

export function setup() {
  if (!token) {
    throw new Error('ACCESS_TOKEN is required for 02-auth-session.js');
  }
  const me = http.get(`${API}/auth/me`, { headers: jsonHeaders(token) });
  if (me.status !== 200) {
    throw new Error(`ACCESS_TOKEN invalid: HTTP ${me.status}`);
  }
  return { token };
}

export default function (data) {
  const h = jsonHeaders(data.token);

  okStatus(http.get(`${API}/auth/me`, { headers: h }), 'GET /auth/me', [200, 429]);
  okStatus(http.get(`${API}/auth/sessions`, { headers: h }), 'GET /auth/sessions', [200, 429]);
  okStatus(http.get(`${API}/blogs?page=1&limit=5`, { headers: h }), 'GET /blogs', [200, 429]);
  okStatus(
    http.get(`${API}/auth/oauth/accounts`, { headers: h }),
    'GET /auth/oauth/accounts',
    [200, 429],
  );

  think(0.15, 0.5);
}
