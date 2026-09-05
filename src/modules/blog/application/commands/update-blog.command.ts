import type { AuditPort } from '@/shared/infrastructure/audit';

import type { BlogEntity } from '../../domain/entities/blog.entity';
import { BlogForbiddenError, BlogNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { UpdateBlogDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type UpdateBlogCommandDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
  audit?: AuditPort;
};

/**
 * Updates blog fields when the caller is the author or an admin.
 */
export class UpdateBlogCommand {
  constructor(private readonly deps: UpdateBlogCommandDeps) {}

  async execute(input: UpdateBlogDto): Promise<BlogEntity> {
    const blog = await this.deps.blogRepository.findById(input.id);
    if (!blog) {
      throw new BlogNotFoundError();
    }

    if (!input.isAdmin && blog.authorId !== input.authorId) {
      throw new BlogForbiddenError('You can only update your own blogs');
    }

    const updated = await this.deps.blogRepository.update(input.id, {
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      coverImage: input.coverImage,
      visibility: input.visibility,
    });

    await this.deps.cache?.invalidate(`blogs:slug:${blog.slug}`);
    await this.deps.cache?.invalidatePattern('blogs:list:*');

    await this.deps.audit?.record({
      actorId: input.authorId,
      action: 'blog.update',
      resource: 'blog',
      resourceId: input.id,
    });

    return updated;
  }
}
