import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@/shared/domain/errors/app-error';
import redisClient from '@/shared/infrastructure/cache/clients/redis-client';

const DEFAULT_TTL_SECONDS = 86_400;
const IN_FLIGHT_TTL_SECONDS = 30;
const KEY_PATTERN = /^[\w-:.]{8,128}$/;

type CachedResponse = {
  status: number;
  body: unknown;
};

type ActorRequest = Request & { user?: { id?: string }; ip?: string };

/**
 * Opt-in idempotency for mutating routes.
 *
 * Key is bound to method + path + actor (user id or IP) so one client cannot
 * replay another client's response. SET NX holds an in-flight lock so two
 * concurrent identical requests do not both execute.
 */
export const createIdempotencyMiddleware = (ttlSeconds = DEFAULT_TTL_SECONDS) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.headers['idempotency-key'];
    if (!rawKey || typeof rawKey !== 'string' || !KEY_PATTERN.test(rawKey.trim())) {
      next();
      return;
    }

    const actorReq = req as ActorRequest;
    const actor = actorReq.user?.id || actorReq.ip || 'anon';
    const redisKey = `idempotency:${actor}:${req.method}:${req.baseUrl}${req.path}:${rawKey.trim()}`;
    const lockKey = `${redisKey}:lock`;

    try {
      const cached = await redisClient.get(redisKey);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedResponse;
        res.status(parsed.status).json(parsed.body);
        return;
      }

      const locked = await redisClient.set(lockKey, '1', 'EX', IN_FLIGHT_TTL_SECONDS, 'NX');
      if (locked !== 'OK') {
        next(AppError.conflict('Request with this Idempotency-Key is already in progress'));
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = ((body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void redisClient
            .setex(redisKey, ttlSeconds, JSON.stringify({ status: res.statusCode, body }))
            .then(() => redisClient.del(lockKey))
            .catch(() => undefined);
        } else {
          void redisClient.del(lockKey);
        }
        return originalJson(body);
      }) as Response['json'];

      next();
    } catch {
      next();
    }
  };
};

export default createIdempotencyMiddleware;
