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

vi.mock('@/services/cache/clients/redis-client', () => ({
  default: redisMock,
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job' }),
    close: vi.fn(),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
}));

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => redisMock),
}));

vi.mock('@/config/prisma/client', () => ({
  default: {
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
    },
    role: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      createMany: vi.fn(),
    },
    permission: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn(),
    },
    rolePermission: {
      createMany: vi.fn(),
    },
    userRole: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    blacklistEntry: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $on: vi.fn(),
    $transaction: vi.fn((ops: unknown) => Promise.all(ops as Promise<unknown>[])),
  },
}));

vi.mock('@/services/logging/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
  },
}));

vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 30000,
});

declare global {
  // eslint-disable-next-line no-var
  var testServer: import('./helpers/test-server').TestServer | undefined;
}
