import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Monte en charge
    { duration: '1m', target: 50 },   // Charge normale
    { duration: '20s', target: 100 }, // Pic de charge
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Moins de 1% d'erreurs
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
  },
};

// Variables
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';
const errorRate = new Rate('errors');

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'loadtest123',
};

export function setup() {
  // S'inscrire avant les tests
  const registerRes = http.post(`${BASE_URL}/auth/register`, {
    name: 'Load Test User',
    email: testUser.email,
    password: testUser.password,
  });

  if (registerRes.status !== 201) {
    console.warn('Failed to register test user, may already exist');
  }

  // Se connecter pour obtenir un token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  if (loginRes.status !== 200) {
    throw new Error('Failed to authenticate test user');
  }

  return {
    authToken: loginRes.json('token'),
  };
}

export default function (data) {
  // Test de connexion
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined,
  });

  if (!loginSuccess) {
    errorRate.add(1);
  }

  const token = loginRes.json('token');

  // Test d'accès à une ressource protégée
  const protectedRes = http.get(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  check(protectedRes, {
    'protected status is 200': (r) => r.status === 200,
    'protected response has user data': (r) => r.json('user') !== undefined,
  });

  sleep(1);
}

export function teardown(data) {
  // Nettoyage après les tests si nécessaire
}
