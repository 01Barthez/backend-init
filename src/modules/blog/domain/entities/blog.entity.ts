/**
 * Blog domain entity — no Prisma / ORM types.
 * Infrastructure maps persistence rows to and from this shape.
 */

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'MEMBERS_ONLY';

export type BlogAuthorSummary = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export type BlogEntity = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  status: ArticleStatus;
  visibility: Visibility;
  authorId: string;
  author?: BlogAuthorSummary;
  views: number;
  likes: number;
  shares: number;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type CreateBlogInput = {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  visibility?: Visibility;
  authorId: string;
  slug: string;
};

export type UpdateBlogInput = Partial<{
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  visibility: Visibility;
  status: ArticleStatus;
  publishedAt: Date | null;
  deletedAt: Date | null;
}>;

export type BlogListResult = {
  items: BlogEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
