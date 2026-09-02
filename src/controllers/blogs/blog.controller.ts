import type { Response } from 'express';

import { SYSTEM_ROLES } from '@/core/constants/app.constants';
import type { AuthenticatedRequest } from '@/core/interfaces/auth.interface';
import rbacService from '@/services/auth/rbac.service';
import blogService from '@/services/blog/blog.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = req.pagination?.page ?? 1;
  const limit = req.pagination?.limit ?? 10;
  const result = await blogService.listPublic(page, limit);
  return response.ok(req, res, result, 'Blogs retrieved successfully');
});

export const getBySlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { slug } = req.params;
  const blog = await blogService.getBySlug(slug);
  return response.ok(req, res, blog, 'Blog retrieved successfully');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, excerpt, coverImage, visibility } = req.body;
  const blog = await blogService.create({
    title,
    content,
    excerpt,
    coverImage,
    visibility,
    authorId: req.user!.id,
  });
  return response.created(req, res, blog, 'Blog created successfully');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = await rbacService.hasAnyRole(req.user!.id, [
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.SUPER_ADMIN,
  ]);
  const blog = await blogService.update(id, req.user!.id, req.body, isAdmin);
  return response.ok(req, res, blog, 'Blog updated successfully');
});

export const publish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = await rbacService.hasAnyRole(req.user!.id, [
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.SUPER_ADMIN,
  ]);
  const blog = await blogService.publish(id, req.user!.id, isAdmin);
  return response.ok(req, res, blog, 'Blog published successfully');
});

export const deleteBlog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = await rbacService.hasAnyRole(req.user!.id, [
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.SUPER_ADMIN,
  ]);
  await blogService.softDelete(id, req.user!.id, isAdmin);
  return response.ok(req, res, null, 'Blog deleted successfully');
});

const blogController = { list, getBySlug, create, update, publish, delete: deleteBlog };

export default blogController;
