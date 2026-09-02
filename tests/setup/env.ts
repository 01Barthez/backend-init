/**
 * Shared test environment defaults.
 * Imported by every Vitest project setup file.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.REDIS_HOST = '127.0.0.1';
process.env.ALLOW_CSRF_PROTECTION = 'false';
process.env.COOKIE_EXPIRES_IN = '7d';
process.env.PRISMA_STUDIO_NAME ??= 'PRISMA_STUDIO';
process.env.PRISMA_STUDIO_PORT ??= '5555';
