import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock external dependencies BEFORE importing services
vi.mock('@/lib/redis', () => ({ redis: null }));
vi.mock('@/lib/queue', () => ({
  aiTaskQueue: { add: vi.fn(), getJobCounts: vi.fn().mockResolvedValue({}) },
  enqueueAITask: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock mongodb to use in-memory connection
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
  default: vi.fn().mockResolvedValue(true),
}));

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Blog Service Integration ─────────────────────────────────────────────────

describe('BlogService with MongoDB Memory Server', () => {
  it('creates and retrieves a blog by slug', async () => {
    const { BlogService } = await import('@/services/blog.service');
    const { User } = await import('@/models/User');

    const author = await User.create({
      name: 'Test Author',
      email: 'author@test.com',
      password: 'hashedpwd',
      role: 'editor',
    });

    const svc = new BlogService();
    const created = await svc.create(
      {
        title: 'Integration Test Post',
        content: '<p>This is the content of the test blog post for integration testing purposes.</p>',
        status: 'published',
        visibility: 'public',
        category: '507f1f77bcf86cd799439011',
      },
      String(author._id)
    );

    expect(created).toBeTruthy();
    const found = await svc.getBySlug((created as { slug: string }).slug);
    expect(found).toBeTruthy();
    expect((found as { title: string } | null)?.title).toBe('Integration Test Post');
  });

  it('returns null for non-existent slug', async () => {
    const { BlogService } = await import('@/services/blog.service');
    const svc = new BlogService();
    const result = await svc.getBySlug('non-existent-slug-xyz');
    expect(result).toBeNull();
  });

  it('paginates blog list correctly', async () => {
    const { BlogService } = await import('@/services/blog.service');
    const { User } = await import('@/models/User');

    const author = await User.create({
      name: 'Paginator',
      email: 'pager@test.com',
      password: 'hash',
      role: 'editor',
    });

    const svc = new BlogService();
    for (let i = 1; i <= 5; i++) {
      await svc.create(
        {
          title: `Blog Post ${i}`,
          content: '<p>This is the content of the test blog post.</p>',
          status: 'published',
          visibility: 'public',
          category: '507f1f77bcf86cd799439011',
        },
        String(author._id)
      );
    }

    const page1 = await svc.list({ status: 'published', page: 1, limit: 3 });
    expect(page1.blogs).toHaveLength(3);
    expect(page1.pagination.total).toBe(5);
    expect(page1.pagination.hasNextPage).toBe(true);

    const page2 = await svc.list({ status: 'published', page: 2, limit: 3 });
    expect(page2.blogs).toHaveLength(2);
    expect(page2.pagination.hasNextPage).toBe(false);
  });

  it('increments view count', async () => {
    const { BlogService } = await import('@/services/blog.service');
    const { User } = await import('@/models/User');
    const { Blog } = await import('@/models/Blog');

    const author = await User.create({
      name: 'View Counter',
      email: 'views@test.com',
      password: 'hash',
      role: 'editor',
    });

    const svc = new BlogService();
    const created = await svc.create(
      {
        title: 'View Test Post',
        content: '<p>This is the content for the view count test post.</p>',
        status: 'published',
        visibility: 'public',
        category: '507f1f77bcf86cd799439011',
      },
      String(author._id)
    );

    const blogId = String((created as { _id: unknown })._id);
    await svc.incrementViews(blogId);

    const updated = await Blog.findById(blogId).lean();
    expect((updated as { views: number } | null)?.views).toBe(1);
  });

  it('returns related blogs by category', async () => {
    const { BlogService } = await import('@/services/blog.service');
    const { User } = await import('@/models/User');

    const author = await User.create({
      name: 'Related Author',
      email: 'related@test.com',
      password: 'hash',
      role: 'editor',
    });

    const svc = new BlogService();
    const categoryId = '507f1f77bcf86cd799439011';

    // Create a main post and related posts
    const main = await svc.create(
      {
        title: 'Main Post for Related Test',
        content: '<p>This is the main post content that is long enough.</p>',
        status: 'published',
        visibility: 'public',
        category: categoryId,
      },
      String(author._id)
    );

    await svc.create(
      {
        title: 'Related Post One',
        content: '<p>This is the first related post content with enough chars.</p>',
        status: 'published',
        visibility: 'public',
        category: categoryId,
      },
      String(author._id)
    );

    const related = await svc.getRelated((main as { slug: string }).slug, 5);
    expect(Array.isArray(related)).toBe(true);
  });
});

// ── Category Service Integration ─────────────────────────────────────────────

describe('CategoryService with MongoDB Memory Server', () => {
  it('creates a category and retrieves it by slug', async () => {
    const { CategoryService } = await import('@/services/category.service');
    const svc = new CategoryService();

    await svc.create({ name: 'Technology', description: 'Tech articles' });
    const found = await svc.getBySlug('technology');
    expect(found).toBeTruthy();
    expect((found as { name: string } | null)?.name).toBe('Technology');
  });

  it('prevents duplicate category names', async () => {
    const { CategoryService } = await import('@/services/category.service');
    const svc = new CategoryService();

    await svc.create({ name: 'Unique Category 99' });
    await expect(svc.create({ name: 'Unique Category 99' })).rejects.toThrow();
  });

  it('lists all active categories', async () => {
    const { CategoryService } = await import('@/services/category.service');
    const svc = new CategoryService();

    await svc.create({ name: 'Cat Alpha' });
    await svc.create({ name: 'Cat Beta' });

    const all = await svc.getAll();
    expect((all as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('deletes a category by ID', async () => {
    const { CategoryService } = await import('@/services/category.service');
    const svc = new CategoryService();

    const created = await svc.create({ name: 'To Delete Cat' });
    const id = String((created as { _id: unknown })._id);
    await svc.delete(id);

    const found = await svc.getBySlug('to-delete-cat');
    expect(found).toBeNull();
  });
});

// ── Tag Service Integration ──────────────────────────────────────────────────

describe('TagService with MongoDB Memory Server', () => {
  it('creates and retrieves tags', async () => {
    const { TagService } = await import('@/services/tag.service');
    const svc = new TagService();

    await svc.create({ name: 'JavaScript' });
    const all = await svc.getAll();
    expect((all as unknown[]).some((t) => (t as { name: string }).name === 'JavaScript')).toBe(true);
  });

  it('prevents duplicate tags', async () => {
    const { TagService } = await import('@/services/tag.service');
    const svc = new TagService();

    await svc.create({ name: 'UniqueTag99' });
    await expect(svc.create({ name: 'UniqueTag99' })).rejects.toThrow();
  });

  it('deletes a tag', async () => {
    const { TagService } = await import('@/services/tag.service');
    const svc = new TagService();

    const created = await svc.create({ name: 'ToDeleteTag' });
    const id = String((created as { _id: unknown })._id);
    await svc.delete(id);

    const all = await svc.getAll();
    expect((all as unknown[]).some((t) => (t as { _id: unknown })._id?.toString() === id)).toBe(false);
  });
});
