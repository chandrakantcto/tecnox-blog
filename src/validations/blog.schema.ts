import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBlogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be URL-safe (lowercase, hyphens only)').optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  featuredImage: z.string().url().optional().or(z.literal('')),
  featuredImageAlt: z.string().max(200).optional(),
  category: z.string().regex(objectIdRegex, 'Invalid category ID'),
  tags: z.array(z.string()).max(10).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private']).default('public'),
  isFeatured: z.boolean().default(false),
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string()).max(10).optional(),
    canonicalUrl: z.string().url().optional().or(z.literal('')),
    ogImage: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
