/**
 * POST /api/dify/webhook
 *
 * Accepts two payload shapes:
 *
 * 1. Real Dify workflow callback (event-based, full blog data in `data` field)
 * 2. Simplified dummy/test payload:
 *      { task_id, status, response?, executed_at? }
 *
 * The handler auto-detects the format by checking for `event` field.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AITask } from '@/models/AITask';
import { Blog, type IBlogDocument } from '@/models/Blog';
import { Category } from '@/models/Category';
import { Tag } from '@/models/Tag';
import { DifyService } from '@/services/dify.service';
import { difyWebhookSchema } from '@/validations/dify-webhook.schema';
import { generateSlug } from '@/utils/slug';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateExcerpt } from '@/utils/excerpt';
import { sanitizeHtml } from '@/utils/sanitize';
import { revalidatePath } from 'next/cache';

const difyService = new DifyService();

// ── Logging helpers ───────────────────────────────────────────────────────────

function logWebhook(label: string, data: unknown) {
  console.info(`[Webhook] ${label}`, JSON.stringify(data, null, 2));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to read request body' },
      { status: 400 },
    );
  }

  logWebhook('Incoming request', {
    receivedAt,
    headers: {
      'content-type':     request.headers.get('content-type'),
      'x-dify-signature': request.headers.get('x-dify-signature'),
    },
    body: rawBody.slice(0, 2000),
  });

  // ── Parse JSON ──────────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logWebhook('Parse error', { rawBody });
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON payload' } },
      { status: 400 },
    );
  }

  // ── Signature validation (only for real Dify payloads) ─────────────────────
  const signature = request.headers.get('x-dify-signature') || '';
  if (signature && !difyService.validateWebhookSignature(rawBody, signature)) {
    logWebhook('Signature validation failed', { signature });
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } },
      { status: 401 },
    );
  }

  // ── Route by payload format ─────────────────────────────────────────────────
  if ('event' in payload) {
    return handleDifyPayload(payload, receivedAt);
  }

  if ('task_id' in payload && 'status' in payload) {
    return handleDummyPayload(payload, receivedAt);
  }

  logWebhook('Unknown payload format', payload);
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Unrecognised payload format' } },
    { status: 400 },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler A: Real Dify workflow callback
// ─────────────────────────────────────────────────────────────────────────────

async function handleDifyPayload(
  payload: Record<string, unknown>,
  receivedAt: string,
): Promise<NextResponse> {
  try {
    const validated = difyWebhookSchema.parse(payload);

    logWebhook('Dify event received', {
      event:           validated.event,
      workflowRunId:   validated.workflow_run_id,
      taskId:          validated.task_id,
    });

    if (validated.event !== 'workflow_run_completed') {
      logWebhook('Event ignored', { event: validated.event });
      return NextResponse.json({ success: true, message: `Event "${validated.event}" ignored` });
    }

    await connectToDatabase();

    const task =
      await AITask.findById(validated.task_id).catch(() => null) ||
      await AITask.findOne({ workflowRunId: validated.workflow_run_id });

    if (!task) {
      logWebhook('Task not found', { taskId: validated.task_id });
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 },
      );
    }

    const blog = await createBlogFromDifyData(task as unknown as Record<string, unknown>, validated.data, validated.workflow_run_id, payload);

    logWebhook('Blog published', {
      blogId: String(blog._id),
      slug:   blog.slug,
      title:  blog.title,
    });

    return NextResponse.json({
      success: true,
      data:    { blogId: String(blog._id), slug: blog.slug },
      message: 'Blog published successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Webhook] Dify handler error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler B: Simplified dummy / test payload
// ─────────────────────────────────────────────────────────────────────────────

async function handleDummyPayload(
  payload: Record<string, unknown>,
  receivedAt: string,
): Promise<NextResponse> {
  const taskId    = String(payload.task_id);
  const status    = String(payload.status) as 'completed' | 'failed' | 'processing';
  const response  = typeof payload.response === 'string' ? payload.response : undefined;
  const executedAt = typeof payload.executed_at === 'string' ? payload.executed_at : receivedAt;

  logWebhook('Dummy payload received', { taskId, status, response, executedAt });

  try {
    await connectToDatabase();

    const task = await AITask.findById(taskId).catch(() => null);

    if (!task) {
      logWebhook('Task not found (dummy)', { taskId });
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Task ${taskId} not found` } },
        { status: 404 },
      );
    }

    // Map dummy status to task status
    const newStatus =
      status === 'completed'  ? 'completed' :
      status === 'failed'     ? 'failed'    :
      status === 'processing' ? 'processing':
      'failed';

    const updatePayload: Record<string, unknown> = {
      status:          newStatus,
      completedAt:     new Date(executedAt),
      webhookPayload:  payload,
    };

    if (newStatus === 'failed') {
      updatePayload.errorMessage = response || 'Task marked failed via dummy webhook';
    }

    await AITask.findByIdAndUpdate(task._id, updatePayload);

    logWebhook('Task updated (dummy)', {
      taskId:    String(task._id),
      newStatus,
      executedAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId:    String(task._id),
        status:    newStatus,
        response:  response || null,
        receivedAt,
        executedAt,
      },
      message: `Dummy webhook processed — task marked as "${newStatus}"`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Webhook] Dummy handler error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Dummy webhook processing failed' } },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: create Blog from Dify data + update AITask
// ─────────────────────────────────────────────────────────────────────────────

async function createBlogFromDifyData(
  task: Record<string, unknown>,
  data: {
    title: string; slug?: string; excerpt?: string; content: string;
    meta_title?: string; meta_description?: string; keywords?: string[];
    category_slug?: string; tags?: string[];
  },
  workflowRunId: string,
  rawPayload: Record<string, unknown>,
): Promise<IBlogDocument> {
  if (!task) throw new Error('Task is null');

  const sanitizedContent = sanitizeHtml(data.content);
  const readingTime      = calculateReadingTime(sanitizedContent);
  const excerpt          = data.excerpt || generateExcerpt(sanitizedContent);

  // Slug — ensure uniqueness
  let slug = data.slug || generateSlug(data.title);
  if (await Blog.findOne({ slug })) {
    slug = `${slug}-${Date.now()}`;
  }

  // Category
  let categoryId = null;
  if (data.category_slug) {
    const cat = await Category.findOne({ slug: data.category_slug });
    if (cat) categoryId = cat._id;
  }
  if (!categoryId) {
    const defaultCat = await Category.findOne({ isActive: true });
    if (defaultCat) categoryId = defaultCat._id;
  }

  // Tags — upsert
  if (data.tags?.length) {
    for (const tagName of data.tags) {
      const tagSlug = generateSlug(tagName);
      await Tag.findOneAndUpdate(
        { slug: tagSlug },
        { $setOnInsert: { name: tagName, slug: tagSlug } },
        { upsert: true, new: true },
      );
    }
  }

  // Create blog
  const blog = await Blog.create({
    title:         data.title,
    slug,
    excerpt,
    content:       sanitizedContent,
    category:      categoryId ?? undefined,
    tags:          data.tags?.map((t) => generateSlug(t)) || [],
    author:        task.createdBy as string,
    seo: {
      metaTitle:       data.meta_title,
      metaDescription: data.meta_description,
      keywords:        data.keywords,
    },
    status:        'published',
    visibility:    'public',
    aiGenerated:   true,
    aiTaskId:      task._id as string,
    difyWorkflowId: workflowRunId,
    readingTime,
    publishedAt:   new Date(),
  });

  // Update task
  await AITask.findByIdAndUpdate(task._id, {
    status:         'completed',
    blogId:         blog._id,
    completedAt:    new Date(),
    webhookPayload: rawPayload,
  });

  // Update category blog count
  if (categoryId) {
    await Category.findByIdAndUpdate(categoryId, { $inc: { blogCount: 1 } });
  }

  // Invalidate ISR cache
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);

  return blog;
}
