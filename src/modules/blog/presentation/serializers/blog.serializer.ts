import type { BlogEntity, BlogListResult } from '../../domain/entities/blog.entity';

/**
 * Maps domain blogs to the public API response shape.
 */
export const BlogSerializer = {
  one(blog: BlogEntity) {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage,
      status: blog.status,
      visibility: blog.visibility,
      authorId: blog.authorId,
      author: blog.author,
      views: blog.views,
      likes: blog.likes,
      shares: blog.shares,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  },

  list(result: BlogListResult) {
    return {
      items: result.items.map(BlogSerializer.one),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },
};
