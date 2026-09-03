import { randomUUID } from 'crypto';

import redisClient from '@/shared/infrastructure/cache/clients/redis-client';
import log from '@/shared/infrastructure/logging/logger';

import type { LockPort } from './lock.port';

const PREFIX = 'lock:';

/**
 * Redis SET NX lock with token compare-and-delete release.
 * Suitable for single-region cron de-duplication — not a full Redlock cluster.
 */
export class RedisLockService implements LockPort {
  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID();
    const result = await redisClient.set(`${PREFIX}${key}`, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  async release(key: string, token: string): Promise<void> {
    const redisKey = `${PREFIX}${key}`;
    const current = await redisClient.get(redisKey);
    if (current === token) {
      await redisClient.del(redisKey);
    }
  }
}

/** Run fn when the lock is acquired; skip silently when another instance holds it. */
export const withDistributedLock = async <T>(
  lock: LockPort,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T | null> => {
  const token = await lock.acquire(key, ttlMs);
  if (!token) {
    log.info('Skipping job — lock held by another instance', { lockKey: key });
    return null;
  }

  try {
    return await fn();
  } finally {
    await lock.release(key, token);
  }
};

export const redisLockService = new RedisLockService();

export default redisLockService;
