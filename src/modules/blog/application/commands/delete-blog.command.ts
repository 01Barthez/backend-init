import type { AuditPort } from '@/shared/infrastructure/audit';

import { BlogForbiddenError, BlogNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { DeleteBlogDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type DeleteBlogCommandDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
  audit?: AuditPort;
};

/**
 * Soft-deletes a blog (sets deletedAt) when the caller is the author or an admin.
 */
export class DeleteBlogCommand {
  constructor(private readonly deps: DeleteBlogCommandDeps) {}

  async execute(input: DeleteBlogDto): Promise<void> {
    const blog = await this.deps.blogRepository.findById(input.id);
    if (!blog) {
      throw new BlogNotFoundError();
    }

    if (!input.isAdmin && blog.authorId !== input.authorId) {
      throw new BlogForbiddenError('You can only delete your own blogs');
    }

    await this.deps.blogRepository.update(input.id, { deletedAt: new Date() });
    await this.deps.cache?.invalidate(`blogs:slug:${blog.slug}`);
    await this.deps.cache?.invalidatePattern('blogs:list:*');

    await this.deps.audit?.record({
      actorId: input.authorId,
      action: 'blog.delete',
      resource: 'blog',
      resourceId: input.id,
    });
  }
}
