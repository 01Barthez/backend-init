import type {
  BlogEntity,
  BlogListResult,
  CreateBlogInput,
  UpdateBlogInput,
} from '../entities/blog.entity';

/**
 * Port for blog persistence required by blog use cases.
 * Infrastructure provides a Prisma implementation.
 */
export interface BlogRepositoryPort {
  create(data: CreateBlogInput): Promise<BlogEntity>;

  findById(id: string): Promise<BlogEntity | null>;

  findPublicBySlug(slug: string): Promise<BlogEntity | null>;

  listPublic(page: number, limit: number): Promise<BlogListResult>;

  /** Fetch published public blogs by id (preserves search result order). */
  findPublicByIds(ids: string[]): Promise<BlogEntity[]>;

  update(id: string, data: UpdateBlogInput): Promise<BlogEntity>;
}
