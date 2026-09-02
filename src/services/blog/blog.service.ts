import type { ArticleStatus, Visibility } from '@prisma/client';

import prisma from '@/config/prisma/client';
import { cacheData, invalidateCache, invalidateCachePattern } from '@/services/cache/cache.service';
import { CacheTTL } from '@/services/cache/interfaces/cache.types';
import log from '@/services/logging/logger';
import { AppError } from '@/utils/errors/app-error';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const blogService = {
  async create(params: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    visibility?: Visibility;
    authorId: string;
  }) {
    const slug = `${slugify(params.title)}-${Date.now().toString(36)}`;

    const blog = await prisma.blog.create({
      data: {
        title: params.title,
        slug,
        content: params.content,
        excerpt: params.excerpt,
        coverImage: params.coverImage,
        visibility: params.visibility ?? 'PUBLIC',
        authorId: params.authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await invalidateCachePattern('blogs:*');
    log.info('Blog created', { blogId: blog.id, authorId: params.authorId });
    return blog;
  },

  async listPublic(page = 1, limit = 10) {
    const cacheKey = `blogs:list:public:${page}:${limit}`;

    return cacheData(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const where = {
          status: 'PUBLISHED' as ArticleStatus,
          visibility: 'PUBLIC' as Visibility,
          deletedAt: null,
        };

        const [items, total] = await Promise.all([
          prisma.blog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
            include: {
              author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          }),
          prisma.blog.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      },
      CacheTTL.SHORT,
    );
  },

  async getBySlug(slug: string) {
    return cacheData(
      `blogs:slug:${slug}`,
      async () => {
        const blog = await prisma.blog.findFirst({
          where: { slug, deletedAt: null, status: 'PUBLISHED', visibility: 'PUBLIC' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        });

        if (!blog) throw AppError.notFound('Blog not found');
        return blog;
      },
      CacheTTL.MEDIUM,
    );
  },

  async getById(id: string) {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: null },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!blog) throw AppError.notFound('Blog not found');
    return blog;
  },

  async update(
    id: string,
    authorId: string,
    data: Partial<{
      title: string;
      content: string;
      excerpt: string;
      coverImage: string;
      visibility: Visibility;
    }>,
    isAdmin = false,
  ) {
    const blog = await this.getById(id);
    if (!isAdmin && blog.authorId !== authorId) {
      throw AppError.forbidden('You can only update your own blogs');
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    await invalidateCache(`blogs:slug:${blog.slug}`);
    await invalidateCachePattern('blogs:list:*');
    return updated;
  },

  async publish(id: string, authorId: string, isAdmin = false) {
    const blog = await this.getById(id);
    if (!isAdmin && blog.authorId !== authorId) {
      throw AppError.forbidden('You can only publish your own blogs');
    }

    return prisma.blog.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  },

  async softDelete(id: string, authorId: string, isAdmin = false) {
    const blog = await this.getById(id);
    if (!isAdmin && blog.authorId !== authorId) {
      throw AppError.forbidden('You can only delete your own blogs');
    }

    await prisma.blog.update({ where: { id }, data: { deletedAt: new Date() } });
    await invalidateCache(`blogs:slug:${blog.slug}`);
    await invalidateCachePattern('blogs:list:*');
  },
};

export default blogService;
