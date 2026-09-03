import prisma from '@/shared/infrastructure/database/prisma.client';

import type { SearchOptions, SearchPort, SearchResult } from './search.port';

/**
 * Mongo search via Prisma contains filters — good enough for template demos.
 * For relevance ranking at scale, implement SearchPort with a dedicated engine.
 */
export class MongoSearchAdapter implements SearchPort {
  async search(index: string, query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = options.skip ?? 0;
    const term = query.trim();

    if (!term) {
      return { hits: [], total: 0 };
    }

    if (index === 'blogs') {
      const where = {
        deletedAt: null,
        status: 'PUBLISHED' as const,
        visibility: 'PUBLIC' as const,
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } },
          { content: { contains: term } },
        ],
      };

      const [rows, total] = await Promise.all([
        prisma.blog.findMany({
          where,
          select: { id: true },
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        prisma.blog.count({ where }),
      ]);

      return {
        hits: rows.map((row) => ({ id: row.id })),
        total,
      };
    }

    return { hits: [], total: 0 };
  }
}

export const mongoSearchAdapter = new MongoSearchAdapter();

export default mongoSearchAdapter;
