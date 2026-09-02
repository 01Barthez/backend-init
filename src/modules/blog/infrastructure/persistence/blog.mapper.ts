import type { Blog as PrismaBlog, User } from '@prisma/client';

import type {
  ArticleStatus,
  BlogAuthorSummary,
  BlogEntity,
  Visibility,
} from '../../domain/entities/blog.entity';

type PrismaBlogWithAuthor = PrismaBlog & {
  author?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null;
};

/**
 * Maps Prisma Blog rows ↔ domain BlogEntity.
 */
export const BlogMapper = {
  toDomain(row: PrismaBlogWithAuthor): BlogEntity {
    const author: BlogAuthorSummary | undefined = row.author
      ? {
          id: row.author.id,
          firstName: row.author.firstName,
          lastName: row.author.lastName,
          avatarUrl: row.author.avatarUrl,
        }
      : undefined;

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      coverImage: row.coverImage,
      status: row.status as ArticleStatus,
      visibility: row.visibility as Visibility,
      authorId: row.authorId,
      author,
      views: row.views,
      likes: row.likes,
      shares: row.shares,
      publishedAt: row.publishedAt,
      scheduledAt: row.scheduledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  },
};
