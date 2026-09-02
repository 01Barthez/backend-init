import { CacheTTL } from '@/shared/infrastructure/cache';

import type { BlogEntity } from '../../domain/entities/blog.entity';
import { BlogNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { GetBlogBySlugDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type GetBlogQueryDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
};

/**
 * Loads a public published blog by slug (cached).
 */
export class GetBlogQuery {
  constructor(private readonly deps: GetBlogQueryDeps) {}

  async execute(input: GetBlogBySlugDto): Promise<BlogEntity> {
    const cacheKey = `blogs:slug:${input.slug}`;

    const loader = async (): Promise<BlogEntity> => {
      const blog = await this.deps.blogRepository.findPublicBySlug(input.slug);
      if (!blog) {
        throw new BlogNotFoundError();
      }
      return blog;
    };

    if (!this.deps.cache) {
      return loader();
    }

    return this.deps.cache.getOrSet(cacheKey, loader, CacheTTL.MEDIUM);
  }
}
