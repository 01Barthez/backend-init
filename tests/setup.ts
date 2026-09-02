/**
 * Global Vitest setup — mocks infrastructure so integration tests stay offline.
 * Keep mocks aligned with `@/shared/...` and `@/app/...` import paths.
 */
import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.REDIS_HOST = '127.0.0.1';

const redisMock = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(0),
  keys: vi.fn().mockResolvedValue([]),
  quit: vi.fn().mockResolvedValue('OK'),
  connect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  status: 'ready',
};

const prismaMock = {
  blog: {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  role: {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn(),
    createMany: vi.fn(),
  },
  permission: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn(),
    createMany: vi.fn(),
  },
  rolePermission: {
    createMany: vi.fn(),
    upsert: vi.fn(),
  },
  userRole: {
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  refreshToken: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  blacklistEntry: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  oAuthAccount: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  aclRule: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $on: vi.fn(),
  $transaction: vi.fn((ops: unknown) => Promise.all(ops as Promise<unknown>[])),
};

const loggerMock = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  http: vi.fn(),
};

const securityLoggerMock = {
  critical: vi.fn(),
  alert: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  notice: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
};

vi.mock('@/shared/infrastructure/cache/clients/redis-client', () => ({
  default: redisMock,
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job' }),
    addBulk: vi.fn().mockResolvedValue([]),
    getRepeatableJobs: vi.fn().mockResolvedValue([]),
    removeRepeatableByKey: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => redisMock),
}));

vi.mock('@/shared/infrastructure/database/prisma.client', () => ({
  default: prismaMock,
}));

vi.mock('@/shared/infrastructure/logging/logger', () => ({
  default: loggerMock,
}));

vi.mock('@/shared/infrastructure/logging/security-logger', () => ({
  default: securityLoggerMock,
  securityRequestLogger: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));

vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 30000,
});

declare global {
  // eslint-disable-next-line no-var
  var testServer: import('./helpers/test-server').TestServer | undefined;
}
