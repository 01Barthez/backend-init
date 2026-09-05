import type { Request, Response } from 'express';

import redisClient from '@/shared/infrastructure/cache/clients/redis-client';
import prisma from '@/shared/infrastructure/database/prisma.client';
import { response } from '@/shared/utils/http/responses/helpers';

type Check = { name: string; ok: boolean; error?: string };

const READY_CACHE_TTL_MS = 3000;

let readyCache: { at: number; ok: boolean; checks: Check[] } | null = null;

const pingMongo = async (): Promise<Check> => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return { name: 'mongodb', ok: true };
  } catch (error: unknown) {
    return {
      name: 'mongodb',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const pingRedis = async (): Promise<Check> => {
  try {
    const pong = await redisClient.ping();
    return { name: 'redis', ok: pong === 'PONG' };
  } catch (error: unknown) {
    return {
      name: 'redis',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Liveness vs readiness.
 * Live = process is up. Ready = Mongo + Redis answered (result cached ~3s).
 */
export function createHealthController() {
  const live = async (req: Request, res: Response): Promise<void> => {
    response.ok(req, res, { status: 'live' }, 'Process is running');
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    const now = Date.now();
    if (readyCache && now - readyCache.at < READY_CACHE_TTL_MS) {
      const payload = {
        status: readyCache.ok ? 'ready' : 'not_ready',
        checks: readyCache.checks,
      };
      if (!readyCache.ok) {
        res.status(503).json({ success: false, message: 'Dependency check failed', data: payload });
        return;
      }
      response.ok(req, res, payload, 'Ready');
      return;
    }

    const checks = await Promise.all([pingMongo(), pingRedis()]);
    const ok = checks.every((check) => check.ok);
    readyCache = { at: now, ok, checks };
    const payload = { status: ok ? 'ready' : 'not_ready', checks };

    if (!ok) {
      res.status(503).json({ success: false, message: 'Dependency check failed', data: payload });
      return;
    }

    response.ok(req, res, payload, 'Ready');
  };

  /** Combined probe — historically readiness; Docker HEALTHCHECK now uses /health/live. */
  const health = ready;

  return { live, ready, health };
}

export type HealthController = ReturnType<typeof createHealthController>;
