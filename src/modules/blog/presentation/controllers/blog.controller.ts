import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { CreateBlogCommand } from '../../application/commands/create-blog.command';
import type { DeleteBlogCommand } from '../../application/commands/delete-blog.command';
import type { PublishBlogCommand } from '../../application/commands/publish-blog.command';
import type { UpdateBlogCommand } from '../../application/commands/update-blog.command';
import type { GetBlogQuery } from '../../application/queries/get-blog.query';
import type { ListPublicBlogsQuery } from '../../application/queries/list-public-blogs.query';
import type { SearchBlogsQuery } from '../../application/queries/search-blogs.query';
import type { BlogRbacPort } from '../../application/services/rbac.port';
import { BlogSerializer } from '../serializers/blog.serializer';

type AuthenticatedRequest = Request & {
  user?: { id: string };
  pagination?: { page: number; limit: number };
};

export type BlogControllerDeps = {
  createBlog: CreateBlogCommand;
  updateBlog: UpdateBlogCommand;
  deleteBlog: DeleteBlogCommand;
  publishBlog: PublishBlogCommand;
  listPublicBlogs: ListPublicBlogsQuery;
  getBlog: GetBlogQuery;
  searchBlogs: SearchBlogsQuery;
  rbac: BlogRbacPort;
};

/**
 * Thin Express handlers — HTTP concerns only; business rules live in commands/queries.
 * Ownership elevation uses :any permissions (not role slug checks).
 */
export function createBlogController(deps: BlogControllerDeps) {
  const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = req.pagination?.page ?? 1;
    const limit = req.pagination?.limit ?? 10;
    const result = await deps.listPublicBlogs.execute({ page, limit });
    return response.ok(req, res, BlogSerializer.list(result), 'Blogs retrieved successfully');
  });

  const search = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = req.pagination?.page ?? 1;
    const limit = req.pagination?.limit ?? 10;
    const query = String(req.query.q ?? '').trim();
    const result = await deps.searchBlogs.execute({ query, page, limit });
    return response.ok(req, res, BlogSerializer.list(result), 'Blog search completed');
  });

  const getBySlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const blog = await deps.getBlog.execute({ slug: req.params.slug });
    return response.ok(req, res, BlogSerializer.one(blog), 'Blog retrieved successfully');
  });

  const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, content, excerpt, coverImage, visibility } = req.body;
    const blog = await deps.createBlog.execute({
      title,
      content,
      excerpt,
      coverImage,
      visibility,
      authorId: req.user!.id,
    });
    return response.created(req, res, BlogSerializer.one(blog), 'Blog created successfully');
  });

  const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const canUpdateAny = await deps.rbac.hasPermission(req.user!.id, 'blog:update:any');
    const { title, content, excerpt, coverImage, visibility } = req.body;
    const blog = await deps.updateBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: canUpdateAny,
      title,
      content,
      excerpt,
      coverImage,
      visibility,
    });
    return response.ok(req, res, BlogSerializer.one(blog), 'Blog updated successfully');
  });

  const publish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Elevation for others' posts: blog:update:any (blog:publish is also held by authors).
    const canPublishAny = await deps.rbac.hasPermission(req.user!.id, 'blog:update:any');
    const blog = await deps.publishBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: canPublishAny,
    });
    return response.ok(req, res, BlogSerializer.one(blog), 'Blog published successfully');
  });

  const deleteBlog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const canDeleteAny = await deps.rbac.hasPermission(req.user!.id, 'blog:delete:any');
    await deps.deleteBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: canDeleteAny,
    });
    return response.ok(req, res, null, 'Blog deleted successfully');
  });

  return { list, search, getBySlug, create, update, publish, delete: deleteBlog };
}

export type BlogController = ReturnType<typeof createBlogController>;
