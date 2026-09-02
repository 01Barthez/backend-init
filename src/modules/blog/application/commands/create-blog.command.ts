import type { BlogEntity } from '../../domain/entities/blog.entity';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import type { CreateBlogDto } from '../dto/blog.dto';
import type { BlogCachePort } from '../services/blog-cache.port';

export type CreateBlogCommandDeps = {
  blogRepository: BlogRepositoryPort;
  cache?: BlogCachePort;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Creates a draft blog post with a unique slug and invalidates list caches.
 */
export class CreateBlogCommand {
  constructor(private readonly deps: CreateBlogCommandDeps) {}

  async execute(input: CreateBlogDto): Promise<BlogEntity> {
    const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;

    const blog = await this.deps.blogRepository.create({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      coverImage: input.coverImage,
      visibility: input.visibility ?? 'PUBLIC',
      authorId: input.authorId,
      slug,
    });

    await this.deps.cache?.invalidatePattern('blogs:*');
    return blog;
  }
}
