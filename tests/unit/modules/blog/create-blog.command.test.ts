import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateBlogCommand } from '@/modules/blog/application/commands/create-blog.command';
import type { BlogRepositoryPort } from '@/modules/blog/domain/repositories/blog.repository';
import { buildBlogEntity } from '../../../factories/blog.factory';

describe('CreateBlogCommand', () => {
  let blogRepository: BlogRepositoryPort;
  let cache: { invalidatePattern: ReturnType<typeof vi.fn> };
  let command: CreateBlogCommand;

  beforeEach(() => {
    blogRepository = {
      create: vi.fn().mockImplementation(async (input) =>
        buildBlogEntity({
          title: input.title,
          content: input.content,
          slug: input.slug,
          authorId: input.authorId,
        }),
      ),
      update: vi.fn(),
      findById: vi.fn(),
      findPublicBySlug: vi.fn(),
      listPublic: vi.fn(),
    };

    cache = { invalidatePattern: vi.fn().mockResolvedValue(undefined) };
    command = new CreateBlogCommand({ blogRepository, cache });
  });

  it('creates a draft with a slugified unique slug and invalidates cache', async () => {
    const blog = await command.execute({
      title: 'Hello World!',
      content: 'Content long enough',
      authorId: 'user_1',
    });

    expect(blogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello World!',
        authorId: 'user_1',
        visibility: 'PUBLIC',
        slug: expect.stringMatching(/^hello-world-/),
      }),
    );
    expect(cache.invalidatePattern).toHaveBeenCalledWith('blogs:*');
    expect(blog.title).toBe('Hello World!');
  });
});
