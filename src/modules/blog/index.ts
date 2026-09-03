import type { Router } from 'express';

import { type AuditPort, auditRepository } from '@/shared/infrastructure/audit';
import { type SearchPort, mongoSearchAdapter } from '@/shared/infrastructure/search';

import { CreateBlogCommand } from './application/commands/create-blog.command';
import { DeleteBlogCommand } from './application/commands/delete-blog.command';
import { PublishBlogCommand } from './application/commands/publish-blog.command';
import { UpdateBlogCommand } from './application/commands/update-blog.command';
import { GetBlogQuery } from './application/queries/get-blog.query';
import { ListPublicBlogsQuery } from './application/queries/list-public-blogs.query';
import { SearchBlogsQuery } from './application/queries/search-blogs.query';
import type { BlogCachePort } from './application/services/blog-cache.port';
import type { BlogRbacPort } from './application/services/rbac.port';
import type { BlogRepositoryPort } from './domain/repositories/blog.repository';
import {
  createBlogCacheAdapter,
  createBlogRbacAdapter,
} from './infrastructure/providers/legacy-adapters';
import { PrismaBlogRepository } from './infrastructure/repositories/prisma-blog.repository';
import {
  type BlogController,
  createBlogController,
} from './presentation/controllers/blog.controller';
import { createBlogRoutes } from './presentation/routes/blog.routes';

/**
 * Explicit dependencies for the blog module.
 */
export type BlogModuleDeps = {
  blogRepository: BlogRepositoryPort;
  rbac: BlogRbacPort;
  cache?: BlogCachePort;
  audit?: AuditPort;
  search?: SearchPort;
};

export type BlogModule = {
  deps: BlogModuleDeps;
  useCases: {
    createBlog: CreateBlogCommand;
    updateBlog: UpdateBlogCommand;
    deleteBlog: DeleteBlogCommand;
    publishBlog: PublishBlogCommand;
    listPublicBlogs: ListPublicBlogsQuery;
    getBlog: GetBlogQuery;
    searchBlogs: SearchBlogsQuery;
  };
  controller: BlogController;
  router: Router;
};

/**
 * Builds default infrastructure adapters.
 * Override any key when wiring a test double or alternate provider.
 */
export function createDefaultBlogDeps(overrides: Partial<BlogModuleDeps> = {}): BlogModuleDeps {
  return {
    blogRepository: overrides.blogRepository ?? new PrismaBlogRepository(),
    rbac: overrides.rbac ?? createBlogRbacAdapter(),
    cache: overrides.cache ?? createBlogCacheAdapter(),
    audit: overrides.audit ?? auditRepository,
    search: overrides.search ?? mongoSearchAdapter,
  };
}

/**
 * Composition root for the blog bounded context.
 */
export function createBlogModule(deps: BlogModuleDeps): BlogModule {
  const useCases = {
    createBlog: new CreateBlogCommand(deps),
    updateBlog: new UpdateBlogCommand(deps),
    deleteBlog: new DeleteBlogCommand(deps),
    publishBlog: new PublishBlogCommand(deps),
    listPublicBlogs: new ListPublicBlogsQuery(deps),
    getBlog: new GetBlogQuery(deps),
    searchBlogs: new SearchBlogsQuery(deps),
  };

  const controller = createBlogController({
    ...useCases,
    rbac: deps.rbac,
  });

  const router = createBlogRoutes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired blog Express router for route registration. */
export function createBlogRouter(overrides: Partial<BlogModuleDeps> = {}): Router {
  return createBlogModule(createDefaultBlogDeps(overrides)).router;
}

export type { BlogEntity } from './domain/entities/blog.entity';
export { PrismaBlogRepository } from './infrastructure/repositories/prisma-blog.repository';
export { blogSchemas } from './presentation/schemas/blog.schemas';
export { BlogSerializer } from './presentation/serializers/blog.serializer';
