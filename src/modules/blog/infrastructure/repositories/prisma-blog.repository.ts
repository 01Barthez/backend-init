import type { ArticleStatus, Visibility } from '@prisma/client';

import prisma from '@/shared/infrastructure/database/prisma.client';

import type {
  BlogEntity,
  BlogListResult,
  CreateBlogInput,
  UpdateBlogInput,
} from '../../domain/entities/blog.entity';
import type { BlogRepositoryPort } from '../../domain/repositories/blog.repository';
import { BlogMapper } from '../persistence/blog.mapper';

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

/**
 * Prisma-backed BlogRepositoryPort.
 * Soft-deleted blogs are excluded (deletedAt: null).
 */
export class PrismaBlogRepository implements BlogRepositoryPort {
  async create(data: CreateBlogInput): Promise<BlogEntity> {
    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        visibility: (data.visibility ?? 'PUBLIC') as Visibility,
        authorId: data.authorId,
      },
      include: { author: { select: authorSelect } },
    });
    return BlogMapper.toDomain(blog);
  }

  async findById(id: string): Promise<BlogEntity | null> {
    const blog = await prisma.blog.findFirst({
      where: { id, deletedAt: null },
      include: { author: { select: authorSelect } },
    });
    return blog ? BlogMapper.toDomain(blog) : null;
  }

  async findPublicBySlug(slug: string): Promise<BlogEntity | null> {
    const blog = await prisma.blog.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      include: { author: { select: authorSelect } },
    });
    return blog ? BlogMapper.toDomain(blog) : null;
  }

  async listPublic(page: number, limit: number): Promise<BlogListResult> {
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
        include: { author: { select: authorSelect } },
      }),
      prisma.blog.count({ where }),
    ]);

    return {
      items: items.map(BlogMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateBlogInput): Promise<BlogEntity> {
    const updated = await prisma.blog.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
        ...(data.visibility !== undefined ? { visibility: data.visibility as Visibility } : {}),
        ...(data.status !== undefined ? { status: data.status as ArticleStatus } : {}),
        ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
        ...(data.deletedAt !== undefined ? { deletedAt: data.deletedAt } : {}),
      },
      include: { author: { select: authorSelect } },
    });
    return BlogMapper.toDomain(updated);
  }
}
