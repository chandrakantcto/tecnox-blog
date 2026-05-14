import { describe, it, expect } from 'vitest';
import { createBlogSchema, updateBlogSchema } from '@/validations/blog.schema';
import { createAITaskSchema } from '@/validations/ai-task.schema';
import { createCategorySchema } from '@/validations/category.schema';
import { createTagSchema } from '@/validations/tag.schema';
import { loginSchema, createUserSchema } from '@/validations/auth.schema';

// ── Blog Schema ──────────────────────────────────────────────────────────────

describe('createBlogSchema', () => {
  const validBlog = {
    title: 'My Test Blog Post',
    content: '<p>' + 'x'.repeat(50) + '</p>',
    category: '507f1f77bcf86cd799439011', // valid ObjectId
    status: 'draft' as const,
    visibility: 'public' as const,
  };

  it('accepts a valid blog payload', () => {
    const result = createBlogSchema.safeParse(validBlog);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const { title: _title, ...noTitle } = validBlog;
    void _title;
    const result = createBlogSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects title that is too short', () => {
    const result = createBlogSchema.safeParse({ ...validBlog, title: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status enum', () => {
    const result = createBlogSchema.safeParse({ ...validBlog, status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid visibility enum', () => {
    const result = createBlogSchema.safeParse({ ...validBlog, visibility: 'secret' });
    expect(result.success).toBe(false);
  });

  it('requires a valid category ObjectId', () => {
    const result = createBlogSchema.safeParse({
      title: 'Valid Title Here',
      content: '<p>' + 'x'.repeat(50) + '</p>',
      category: '507f1f77bcf86cd799439011',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateBlogSchema', () => {
  it('accepts partial updates', () => {
    const result = updateBlogSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateBlogSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status in update', () => {
    const result = updateBlogSchema.safeParse({ status: 'bad_status' });
    expect(result.success).toBe(false);
  });
});

// ── AI Task Schema ───────────────────────────────────────────────────────────

describe('createAITaskSchema', () => {
  const validTask = {
    contentType: 'General' as const,
    keywords: ['AI', 'machine learning', 'automation'],
  };

  it('accepts a valid task payload', () => {
    const result = createAITaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('requires at least one keyword', () => {
    const result = createAITaskSchema.safeParse({ ...validTask, keywords: [] });
    expect(result.success).toBe(false);
  });

  it('rejects missing contentType', () => {
    const { contentType: _c, ...noType } = validTask;
    void _c;
    const result = createAITaskSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it('accepts optional targetUrl', () => {
    const result = createAITaskSchema.safeParse({
      ...validTask,
      targetUrl: 'https://example.com/product',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL for targetUrl', () => {
    const result = createAITaskSchema.safeParse({
      ...validTask,
      targetUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

// ── Category Schema ──────────────────────────────────────────────────────────

describe('createCategorySchema', () => {
  it('accepts valid category', () => {
    const result = createCategorySchema.safeParse({ name: 'Technology' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional description and color', () => {
    const result = createCategorySchema.safeParse({
      name: 'Science',
      description: 'Science articles',
      color: '#00ff00',
    });
    expect(result.success).toBe(true);
  });
});

// ── Tag Schema ───────────────────────────────────────────────────────────────

describe('createTagSchema', () => {
  it('accepts valid tag', () => {
    const result = createTagSchema.safeParse({ name: 'javascript' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createTagSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

// ── Auth Schemas ─────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@example.com',
      password: 'securepassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securepass123',
    role: 'editor' as const,
  };

  it('accepts valid user', () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'superuser' });
    expect(result.success).toBe(false);
  });

  it('rejects password that is too short', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = createUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
