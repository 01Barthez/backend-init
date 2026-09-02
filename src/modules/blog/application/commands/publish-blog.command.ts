import type { BlogEntity } from '../../domain/entities/blog.entity';
import { BlogForbiddenError, BlogNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { PublishBlogDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type PublishBlogCommandDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
};

/**
 * Marks a blog as PUBLISHED and sets publishedAt.
 */
export class PublishBlogCommand {
  constructor(private readonly deps: PublishBlogCommandDeps) {}

  async execute(input: PublishBlogDto): Promise<BlogEntity> {
    const blog = await this.deps.blogRepository.findById(input.id);
    if (!blog) {
      throw new BlogNotFoundError();
    }

    if (!input.isAdmin && blog.authorId !== input.authorId) {
      throw new BlogForbiddenError('You can only publish your own blogs');
    }

    const updated = await this.deps.blogRepository.update(input.id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await this.deps.cache?.invalidate(`blogs:slug:${blog.slug}`);
    await this.deps.cache?.invalidatePattern('blogs:list:*');
    return updated;
  }
}
