import type { SearchPort } from '@/shared/infrastructure/search';

import type { BlogListResult } from '../../domain/entities/blog.entity';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';

export type SearchBlogsDto = {
  query: string;
  page: number;
  limit: number;
};

export type SearchBlogsQueryDeps = {
  blogRepository: BlogRepositoryPort;
  search?: SearchPort;
};

/**
 * Full-text-ish search over published public blogs via SearchPort.
 */
export class SearchBlogsQuery {
  constructor(private readonly deps: SearchBlogsQueryDeps) {}

  async execute(input: SearchBlogsDto): Promise<BlogListResult> {
    const page = input.page || 1;
    const limit = Math.min(input.limit || 10, 50);
    const skip = (page - 1) * limit;
    const term = input.query.trim();

    if (!term || !this.deps.search) {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const result = await this.deps.search.search('blogs', term, { limit, skip });
    const ids = result.hits.map((hit) => hit.id);

    if (ids.length === 0) {
      return { items: [], total: result.total, page, limit, totalPages: 0 };
    }

    const items = await this.deps.blogRepository.findPublicByIds(ids);
    const totalPages = Math.ceil(result.total / limit);

    return {
      items,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }
}
