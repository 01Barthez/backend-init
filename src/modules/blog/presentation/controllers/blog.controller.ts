import type { Request, Response } from 'express';

import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { CreateBlogCommand } from '../../application/commands/create-blog.command';
import type { DeleteBlogCommand } from '../../application/commands/delete-blog.command';
import type { PublishBlogCommand } from '../../application/commands/publish-blog.command';
import type { UpdateBlogCommand } from '../../application/commands/update-blog.command';
import type { GetBlogQuery } from '../../application/queries/get-blog.query';
import type { ListPublicBlogsQuery } from '../../application/queries/list-public-blogs.query';
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
  rbac: BlogRbacPort;
};

/**
 * Thin Express handlers — HTTP concerns only; business rules live in commands/queries.
 */
export function createBlogController(deps: BlogControllerDeps) {
  const isAdmin = async (userId: string): Promise<boolean> =>
    deps.rbac.hasAnyRole(userId, [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPER_ADMIN]);

  const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = req.pagination?.page ?? 1;
    const limit = req.pagination?.limit ?? 10;
    const result = await deps.listPublicBlogs.execute({ page, limit });
    return response.ok(req, res, BlogSerializer.list(result), 'Blogs retrieved successfully');
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
    const admin = await isAdmin(req.user!.id);
    const blog = await deps.updateBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: admin,
      ...req.body,
    });
    return response.ok(req, res, BlogSerializer.one(blog), 'Blog updated successfully');
  });

  const publish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const admin = await isAdmin(req.user!.id);
    const blog = await deps.publishBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: admin,
    });
    return response.ok(req, res, BlogSerializer.one(blog), 'Blog published successfully');
  });

  const deleteBlog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const admin = await isAdmin(req.user!.id);
    await deps.deleteBlog.execute({
      id: req.params.id,
      authorId: req.user!.id,
      isAdmin: admin,
    });
    return response.ok(req, res, null, 'Blog deleted successfully');
  });

  return { list, getBySlug, create, update, publish, delete: deleteBlog };
}

export type BlogController = ReturnType<typeof createBlogController>;
