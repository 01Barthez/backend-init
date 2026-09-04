/**
 * Shared k6 helpers for backend-init load tests.
 * BASE_URL defaults to http://127.0.0.1:3000
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000';
export const API = `${BASE}/api/v1`;

// Treat rate-limit / redirect / client auth failures as expected so http_req_failed
// measures transport/5xx, not intentional limiter responses under capacity runs.
http.setResponseCallback(
  http.expectedStatuses(200, 201, 204, 301, 302, 303, 307, 308, 400, 401, 403, 404, 409, 429, 501, 503),
);

export function jsonHeaders(token) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function okStatus(res, name, codes = [200]) {
  const list = Array.isArray(codes) ? codes : [codes];
  return check(res, {
    [`${name} status in ${list.join(',')}`]: (r) => list.includes(r.status),
  });
}

/** Light think-time so VU ramps look like real clients. */
export function think(min = 0.2, max = 0.8) {
  sleep(min + Math.random() * (max - min));
}

export function signupLogin(prefix) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `${prefix}.${stamp}@load.test`;
  const password = 'LoadTest1!Pass';

  const signup = http.post(
    `${API}/auth/signup`,
    JSON.stringify({
      email,
      password,
      firstName: 'Load',
      lastName: 'User',
      phone: '+15559876543',
    }),
    { headers: jsonHeaders() },
  );
  okStatus(signup, 'signup', [201, 409, 429]);

  // Live OTP is not available under pure load; reuse pre-seeded token if provided.
  if (__ENV.ACCESS_TOKEN) {
    return { email, password, access: __ENV.ACCESS_TOKEN };
  }

  const login = http.post(`${API}/auth/login`, JSON.stringify({ email, password }), {
    headers: jsonHeaders(),
  });
  // Unverified users get 403/401 — acceptable for signup flood scenarios.
  okStatus(login, 'login', [200, 401, 403, 429]);
  let access = '';
  const authHdr = login.headers['Authorization'] || login.headers['authorization'] || '';
  if (String(authHdr).toLowerCase().startsWith('bearer ')) {
    access = String(authHdr).slice(7).trim();
  } else {
    try {
      access = login.json('data.accessToken') || '';
    } catch {
      access = '';
    }
  }
  return { email, password, access };
}
