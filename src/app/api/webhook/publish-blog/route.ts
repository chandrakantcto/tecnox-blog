/**
 * POST /api/webhook/publish-blog
 *
 * Dedicated webhook endpoint for Dify (or any caller) to publish a blog post
 * directly into the database with a single JSON payload.
 *
 * ── Authentication ────────────────────────────────────────────────────────────
 * Secured via BLOG_WEBHOOK_SECRET.  Pass it as:
 *   Authorization: Bearer <BLOG_WEBHOOK_SECRET>
 *   — OR —
 *   X-Webhook-Secret: <BLOG_WEBHOOK_SECRET>
 *
 * Auth is skipped in development when the header is absent.
 *
 * ── Webhook URL ───────────────────────────────────────────────────────────────
 *   Production : https://<your-domain>/api/webhook/publish-blog
 *   Development: http://localhost:3003/api/webhook/publish-blog
 *
 * ── Minimal payload ───────────────────────────────────────────────────────────
 * {
 *   "title":   "My Blog Post",
 *   "content": "<p>Body…</p>"
 * }
 *
 * ── Full payload ──────────────────────────────────────────────────────────────
 * {
 *   "title":               "My Blog Post",
 *   "slug":                "my-blog-post",
 *   "content":             "<p>Body…</p>",
 *   "excerpt":             "Short intro",
 *   "meta_title":          "SEO Title",
 *   "meta_description":    "SEO description",
 *   "keywords":            ["ai", "automation"],
 *   "tags":                ["Technology", "AI Writing"],
 *   "category":            "technology",
 *   "featured_image":      "https://cdn.example.com/hero.jpg",
 *   "featured_image_alt":  "Hero image",
 *   "author_email":        "superadmin@aiblog.com",
 *   "publish_status":      "published",
 *   "published_at":        "2026-05-13T10:30:00Z",
 *   "canonical_url":       "https://myblog.com/my-blog-post",
 *   "og_image":            "https://cdn.example.com/og.jpg",
 *   "is_featured":         false,
 *   "task_id":             "682abc123def456789012345",
 *   "workflow_run_id":     "wf-run-001"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import { Category } from '@/models/Category';
import { Tag } from '@/models/Tag';
import { User } from '@/models/User';
import { AITask } from '@/models/AITask';
import { blogPublishWebhookSchema } from '@/validations/blog-publish-webhook.schema';
import { generateSlug } from '@/utils/slug';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateExcerpt } from '@/utils/excerpt';
import { sanitizeHtml } from '@/utils/sanitize';
import { revalidatePath } from 'next/cache';

// ── Logging ──────────────────────────────────────────────────────────────────

function log(label: string, data?: unknown) {
  if (data !== undefined) {
    console.info(`[PublishWebhook] ${label}`, JSON.stringify(data, null, 2));
  } else {
    console.info(`[PublishWebhook] ${label}`);
  }
}

// ── GET — documentation & test info ─────────────────────────────────────────

export async function GET() {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  return NextResponse.json({
    endpoint:    `${base}/api/webhook/publish-blog`,
    method:      'POST',
    auth:        'Authorization: Bearer <BLOG_WEBHOOK_SECRET>  OR  X-Webhook-Secret: <value>',
    description: 'Publish a blog post directly from Dify or any external caller.',
    required_fields: ['title', 'content'],
    optional_fields: [
      'slug', 'excerpt', 'category', 'tags', 'featured_image', 'featured_image_alt',
      'author_email', 'publish_status', 'published_at', 'is_featured',
      'meta_title', 'meta_description', 'keywords', 'canonical_url', 'og_image',
      'task_id', 'workflow_run_id',
    ],
    example_payload: {
      title:              'My AI-Generated Blog Post',
      slug:               'my-ai-generated-blog-post',
      content:            '<h2>Introduction</h2><p>Body content here…</p>',
      excerpt:            'Short preview description',
      meta_title:         'My AI Blog Post | SEO Title',
      meta_description:   'A short meta description under 160 characters.',
      keywords:           ['artificial intelligence', 'automation', 'blogging'],
      tags:               ['Technology', 'AI Writing', 'Automation'],
      category:           'technology',
      featured_image:     'https://cdn.example.com/hero.jpg',
      featured_image_alt: 'Hero image showing AI concept',
      author_email:       'superadmin@aiblog.com',
      publish_status:     'published',
      published_at:       new Date().toISOString(),
      canonical_url:      `${base}/blog/my-ai-generated-blog-post`,
      og_image:           'https://cdn.example.com/og.jpg',
      is_featured:        false,
      task_id:            '682abc123def456789012345',
      workflow_run_id:    'wf-run-001',
    },
  });
}

// ── POST — publish blog ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const secret = process.env.BLOG_WEBHOOK_SECRET;

  if (secret) {
    const authHeader   = request.headers.get('authorization') || '';
    const secretHeader = request.headers.get('x-webhook-secret') || '';
    const providedToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : secretHeader;

    if (providedToken !== secret) {
      log('Auth failed', { providedToken: providedToken ? '[redacted]' : '(none)' });
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } },
        { status: 401 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    // No secret configured in prod — refuse all requests
    return NextResponse.json(
      { success: false, error: { code: 'MISCONFIGURED', message: 'BLOG_WEBHOOK_SECRET not set on server' } },
      { status: 500 },
    );
  } else {
    log('Auth skipped — BLOG_WEBHOOK_SECRET not set (development mode)');
  }

  // ── 2. Read & parse body ───────────────────────────────────────────────────
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'READ_ERROR', message: 'Failed to read request body' } },
      { status: 400 },
    );
  }

  log('Incoming request', {
    receivedAt,
    contentType:   request.headers.get('content-type'),
    bodyPreview:   rawBody.slice(0, 500),
  });

  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    log('JSON parse error');
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  // ── 3. Validate ────────────────────────────────────────────────────────────
  const parsed = blogPublishWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      field:   i.path.join('.'),
      message: i.message,
    }));
    log('Validation failed', issues);
    return NextResponse.json(
      {
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Payload validation failed',
          issues,
        },
      },
      { status: 422 },
    );
  }

  const input = parsed.data;
  log('Payload validated', { title: input.title, category: input.category, tags: input.tags });

  // ── 4. Database processing ─────────────────────────────────────────────────
  try {
    await connectToDatabase();

    // ── 4a. Sanitize HTML content ────────────────────────────────────────────
    const sanitizedContent = sanitizeHtml(input.content);
    const readingTime      = calculateReadingTime(sanitizedContent);
    const excerpt          = input.excerpt
      ? input.excerpt.trim()
      : generateExcerpt(sanitizedContent);

    // ── 4b. Resolve / ensure unique slug ────────────────────────────────────
    const baseSlug = input.slug || generateSlug(input.title);
    let   slug     = baseSlug;
    if (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${Date.now()}`;
      log('Slug collision resolved', { baseSlug, resolvedSlug: slug });
    }

    // ── 4c. Resolve category ─────────────────────────────────────────────────
    let categoryId: string | null = null;

    if (input.category) {
      // Try slug match first, then name match (case-insensitive)
      const cat =
        await Category.findOne({ slug: input.category.toLowerCase().replace(/\s+/g, '-') }) ||
        await Category.findOne({ name: { $regex: new RegExp(`^${input.category}$`, 'i') } });

      if (cat) {
        categoryId = String(cat._id);
        log('Category resolved', { input: input.category, name: cat.name });
      } else {
        log('Category not found — will auto-create', { input: input.category });
        // Auto-create the category
        const newCat = await Category.create({
          name:     input.category.charAt(0).toUpperCase() + input.category.slice(1),
          slug:     generateSlug(input.category),
          isActive: true,
        });
        categoryId = String(newCat._id);
        log('Category created', { name: newCat.name, slug: newCat.slug });
      }
    }

    // Final fallback — use first active category
    if (!categoryId) {
      const defaultCat = await Category.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (defaultCat) {
        categoryId = String(defaultCat._id);
        log('Using default category', { name: defaultCat.name });
      }
    }

    // ── 4d. Resolve author ───────────────────────────────────────────────────
    let authorId: string | null = null;

    if (input.author_email) {
      const author = await User.findOne({ email: input.author_email.toLowerCase() });
      if (author) {
        authorId = String(author._id);
        log('Author resolved', { email: input.author_email });
      } else {
        log('Author email not found — using fallback', { email: input.author_email });
      }
    }

    // Fallback to first super_admin or any active admin
    if (!authorId) {
      const fallback =
        await User.findOne({ role: 'super_admin', isActive: true }) ||
        await User.findOne({ role: 'admin',       isActive: true }) ||
        await User.findOne({ isActive: true });
      if (fallback) {
        authorId = String(fallback._id);
        log('Using fallback author', { email: fallback.email, role: fallback.role });
      }
    }

    if (!authorId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_AUTHOR', message: 'No user found to assign as author' } },
        { status: 422 },
      );
    }

    // ── 4e. Upsert tags ──────────────────────────────────────────────────────
    const tagSlugs: string[] = [];
    if (input.tags?.length) {
      for (const tagName of input.tags) {
        const tagSlug = generateSlug(tagName);
        await Tag.findOneAndUpdate(
          { slug: tagSlug },
          { $setOnInsert: { name: tagName, slug: tagSlug } },
          { upsert: true, new: true },
        );
        tagSlugs.push(tagSlug);
      }
      log('Tags upserted', tagSlugs);
    }

    // ── 4f. Resolve linked AITask (optional) ─────────────────────────────────
    let aiTaskId: string | null = null;
    if (input.task_id) {
      const task = await AITask.findById(input.task_id).catch(() => null);
      if (task) {
        aiTaskId = String(task._id);
        log('Linked to AITask', { taskId: input.task_id });
      } else {
        log('task_id provided but not found — ignoring', { taskId: input.task_id });
      }
    }

    // ── 4g. Build published timestamp ─────────────────────────────────────────
    const publishedAt = input.published_at
      ? new Date(input.published_at)
      : new Date();

    // ── 4h. Create blog document ──────────────────────────────────────────────
    const blog = await Blog.create({
      title:             input.title,
      slug,
      excerpt,
      content:           sanitizedContent,
      featuredImage:     input.featured_image,
      featuredImageAlt:  input.featured_image_alt,
      category:          categoryId ?? undefined,
      tags:              tagSlugs,
      author:            authorId,
      seo: {
        metaTitle:       input.meta_title       || input.title.slice(0, 60),
        metaDescription: input.meta_description || excerpt.slice(0, 160),
        keywords:        input.keywords         || [],
        canonicalUrl:    input.canonical_url,
        ogImage:         input.og_image         || input.featured_image,
      },
      status:            input.publish_status,
      visibility:        'public',
      isFeatured:        input.is_featured,
      aiGenerated:       true,
      aiTaskId:          aiTaskId ?? undefined,
      difyWorkflowId:    input.workflow_run_id,
      readingTime,
      publishedAt:       input.publish_status === 'published' ? publishedAt : undefined,
    });

    log('Blog created', {
      blogId:  String(blog._id),
      slug:    blog.slug,
      title:   blog.title,
      status:  blog.status,
    });

    // ── 4i. Update category blog count ────────────────────────────────────────
    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, { $inc: { blogCount: 1 } });
    }

    // ── 4j. Update linked AITask ──────────────────────────────────────────────
    if (aiTaskId) {
      await AITask.findByIdAndUpdate(aiTaskId, {
        status:         'completed',
        blogId:         blog._id,
        completedAt:    new Date(),
        webhookPayload: raw,
      });
      log('AITask marked completed', { taskId: input.task_id });
    }

    // ── 4k. Invalidate ISR cache ──────────────────────────────────────────────
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    if (categoryId) revalidatePath('/blog/category/' + (input.category || ''));

    // ── 5. Return success ─────────────────────────────────────────────────────
    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const blogUrl = `${base}/blog/${slug}`;

    log('Blog published successfully', { blogId: String(blog._id), slug, blogUrl });

    return NextResponse.json(
      {
        success:     true,
        message:     'Blog published successfully',
        data: {
          blogId:          String(blog._id),
          title:           blog.title,
          slug,
          url:             blogUrl,
          status:          blog.status,
          publishedAt:     blog.publishedAt?.toISOString() ?? null,
          readingTime:     blog.readingTime,
          excerpt,
          category:        categoryId ? String(categoryId) : null,
          tags:            tagSlugs,
          seo: {
            metaTitle:       blog.seo?.metaTitle,
            metaDescription: blog.seo?.metaDescription,
            keywords:        blog.seo?.keywords,
            canonicalUrl:    blog.seo?.canonicalUrl,
            ogImage:         blog.seo?.ogImage,
          },
          aiTaskId:        aiTaskId ? String(aiTaskId) : null,
          workflowRunId:   input.workflow_run_id ?? null,
          receivedAt,
        },
      },
      { status: 201 },
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PublishWebhook] Processing error:', msg, error);

    // Return duplicate slug error with a helpful message
    if (msg.includes('duplicate key') || msg.includes('E11000')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code:    'DUPLICATE_SLUG',
            message: 'A blog with this slug already exists. Provide a unique slug or omit it for auto-generation.',
          },
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Blog publishing failed' } },
      { status: 500 },
    );
  }
}
