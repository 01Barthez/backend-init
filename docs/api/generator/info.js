/**
 * OpenAPI info, servers, and tags.
 */
const info = {
  title: 'Backend Init API',
  description: [
    'Production-ready Express + TypeScript modular monolith template.',
    '',
    'Features: RS256 JWT auth (OTP + optional TOTP), OAuth 2.0, RBAC user admin,',
    'file uploads (MinIO / S3), Redis caching, BullMQ jobs, and operator surfaces.',
    '',
    '**Authentication:** send `Authorization: Bearer <access_token>` on protected routes.',
    'Refresh tokens use an HTTP-only cookie; `/auth/refresh` also accepts `refreshToken` in JSON.',
    '',
    '**Base paths:** domain APIs under `/api/v1`. System endpoints (`/health`, `/csrf-token`,',
    '`/metrics`, CSP report URI, Bull Board) are at the application root.',
    '',
    '**Operator UIs:** `/api-docs`, `/api-docs.json`, `/metrics`, and `/admin/queues` require',
    'HTTP Basic (`ADMIN_BASIC_*`, fallback `SWAGGER_*`) outside tests and are not published',
    'through the sample Nginx public surface.',
    '',
    '**Identity vs admin:** `GET /api/v1/auth/me` is the self snapshot (roles + permissions).',
    'User administration lives under `/api/v1/users`.',
  ].join('\n'),
  version: '1.0.0',
  contact: {
    name: 'Barthez Kenwou',
    email: 'kenwoubarthez@gmail.com',
    url: 'https://github.com/barthez-kenwou/backend-init',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
};

const servers = [
  {
    url: 'http://localhost:3000',
    description: 'Local development',
  },
];

const tags = [
  {
    name: 'Authentication',
    description:
      'Signup, OTP, login, refresh, password flows, current user (`/me`), sessions, and optional TOTP',
  },
  {
    name: 'OAuth',
    description:
      'Social login (redirect providers + Telegram widget), account linking and unlinking',
  },
  {
    name: 'Users',
    description:
      'Self-service profile and admin user lifecycle (invite, activate, unlock, export, GDPR delete)',
  },
  {
    name: 'Blogs',
    description: 'Reference blog domain used to validate the modular template',
  },
  {
    name: 'Files',
    description: 'Presigned object-storage URLs for large uploads/downloads',
  },
  {
    name: 'System',
    description:
      'Health, CSRF, Prometheus metrics, CSP reports, audit list/detail/export, and Bull Board',
  },
];

module.exports = { info, servers, tags };
