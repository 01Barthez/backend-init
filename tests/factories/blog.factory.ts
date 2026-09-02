import type { BlogEntity } from '@/modules/blog/domain/entities/blog.entity';

let seq = 0;

/**
 * Builds a BlogEntity for unit tests.
 */
export const buildBlogEntity = (overrides: Partial<BlogEntity> = {}): BlogEntity => {
  seq += 1;
  const now = new Date();
  return {
    id: overrides.id ?? `blog_${seq}`,
    title: overrides.title ?? `Post ${seq}`,
    slug: overrides.slug ?? `post-${seq}`,
    excerpt: overrides.excerpt ?? 'Short excerpt',
    content: overrides.content ?? 'Long enough content for a demo blog post.',
    coverImage: overrides.coverImage ?? null,
    status: overrides.status ?? 'DRAFT',
    visibility: overrides.visibility ?? 'PUBLIC',
    authorId: overrides.authorId ?? 'user_0001',
    author: overrides.author,
    views: overrides.views ?? 0,
    likes: overrides.likes ?? 0,
    shares: overrides.shares ?? 0,
    publishedAt: overrides.publishedAt ?? null,
    scheduledAt: overrides.scheduledAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
  };
};
