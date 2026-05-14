import { z } from 'zod';

/**
 * Zod schema for the POST /api/webhook/publish-blog endpoint.
 *
 * Dify (or any caller) sends a fully-structured JSON object.
 * Every field maps directly to IBlogDocument — required fields are enforced,
 * everything else is optional with sensible defaults.
 *
 * Example minimal payload:
 * {
 *   "title":   "My Blog Post",
 *   "content": "<p>Body content…</p>"
 * }
 *
 * Example full payload:
 * {
 *   "title":               "My Blog Post",
 *   "slug":                "my-blog-post",
 *   "content":             "<p>Body content…</p>",
 *   "excerpt":             "Short intro…",
 *   "meta_title":          "SEO Title (max 60)",
 *   "meta_description":    "SEO description (max 160)",
 *   "keywords":            ["ai", "automation"],
 *   "tags":                ["Technology", "AI Writing"],
 *   "category":            "technology",
 *   "featured_image":      "https://cdn.example.com/hero.jpg",
 *   "featured_image_alt":  "Hero image alt text",
 *   "author_email":        "superadmin@aiblog.com",
 *   "publish_status":      "published",
 *   "published_at":        "2026-05-13T10:30:00Z",
 *   "canonical_url":       "https://myblog.com/my-blog-post",
 *   "og_image":            "https://cdn.example.com/og.jpg",
 *   "is_featured":         false,
 *   "task_id":             "682abc123def456789012345"
 * }
 */
export const blogPublishWebhookSchema = z.object({

  // ── Core content ───────────────────────────────────────────────────────────

  /** Post title (required). Max 200 chars. */
  title: z
    .string()
    .min(1, 'title cannot be empty')
    .max(200, 'title max 200 chars')
    .trim(),

  /** URL slug. Auto-generated from title when omitted. */
  slug: z
    .string()
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens')
    .optional(),

  /** Full HTML/Markdown body (required). */
  content: z
    .string()
    .min(1, 'content cannot be empty'),

  /** Short preview / description. Auto-generated from content when omitted. */
  excerpt: z.string().optional(),

  // ── Taxonomy ───────────────────────────────────────────────────────────────

  /**
   * Category slug or name.
   * - Matched first as slug, then as name (case-insensitive).
   * - Falls back to the first active category when not provided.
   */
  category: z.string().optional(),

  /**
   * Array of tag names. Tags are upserted automatically.
   * Accepts both string arrays and comma-separated strings.
   */
  tags: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
    ])
    .optional(),

  // ── Media ──────────────────────────────────────────────────────────────────

  /** Absolute URL of the featured/hero image. */
  featured_image: z.string().url('featured_image must be a valid URL').optional(),

  /** Alt text for featured image. */
  featured_image_alt: z.string().optional(),

  // ── Author ─────────────────────────────────────────────────────────────────

  /**
   * Email of the author user in the database.
   * Falls back to the first super_admin when not provided.
   */
  author_email: z.string().email('author_email must be a valid email').optional(),

  // ── Publishing ─────────────────────────────────────────────────────────────

  /** Publication status. Defaults to "published". */
  publish_status: z
    .enum(['published', 'draft', 'archived'])
    .default('published'),

  /** ISO-8601 publish timestamp. Defaults to now. */
  published_at: z.string().datetime({ offset: true }).optional(),

  /** Pin this post at the top of listings. */
  is_featured: z.boolean().default(false),

  // ── SEO ────────────────────────────────────────────────────────────────────

  /** <title> tag override. */
  meta_title: z.string().optional(),

  /** <meta name="description"> content. */
  meta_description: z.string().optional(),

  /** Focus / target keywords. */
  keywords: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((s) => s.split(',').map((k) => k.trim()).filter(Boolean)),
    ])
    .optional(),

  /** Canonical URL for the post. */
  canonical_url: z.string().url('canonical_url must be a valid URL').optional(),

  /** Open Graph image URL (falls back to featured_image). */
  og_image: z.string().url('og_image must be a valid URL').optional(),

  // ── Linking (optional) ─────────────────────────────────────────────────────

  /** MongoDB ObjectId of the originating AI task (if triggered via task queue). */
  task_id: z.string().regex(/^[a-f\d]{24}$/i, 'task_id must be a 24-char hex ObjectId').optional(),

  /** Dify workflow run ID (stored for traceability). */
  workflow_run_id: z.string().optional(),
});

export type BlogPublishWebhookInput = z.infer<typeof blogPublishWebhookSchema>;
