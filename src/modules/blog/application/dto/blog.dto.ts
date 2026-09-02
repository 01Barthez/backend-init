import type { Visibility } from '../../domain/entities/blog.entity';

export type CreateBlogDto = {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  visibility?: Visibility;
  authorId: string;
};

export type UpdateBlogDto = {
  id: string;
  authorId: string;
  isAdmin: boolean;
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  visibility?: Visibility;
};

export type PublishBlogDto = {
  id: string;
  authorId: string;
  isAdmin: boolean;
};

export type DeleteBlogDto = {
  id: string;
  authorId: string;
  isAdmin: boolean;
};

export type GetBlogBySlugDto = {
  slug: string;
};

export type ListPublicBlogsDto = {
  page: number;
  limit: number;
};
