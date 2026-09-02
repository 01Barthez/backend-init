import { CacheTTL } from '@/shared/infrastructure/cache';

import type { BlogListResult } from '../../domain/entities/blog.entity';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { ListPublicBlogsDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type ListPublicBlogsQueryDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
};

/**
 * Returns a paginated list of PUBLISHED + PUBLIC blogs (cached).
 */
export class ListPublicBlogsQuery {
  constructor(private readonly deps: ListPublicBlogsQueryDeps) {}

  async execute(input: ListPublicBlogsDto): Promise<BlogListResult> {
    const page = input.page || 1;
    const limit = input.limit || 10;
    const cacheKey = `blogs:list:public:${page}:${limit}`;

    if (!this.deps.cache) {
      return this.deps.blogRepository.listPublic(page, limit);
    }

    return this.deps.cache.getOrSet(
      cacheKey,
      () => this.deps.blogRepository.listPublic(page, limit),
      CacheTTL.SHORT,
    );
  }
}
