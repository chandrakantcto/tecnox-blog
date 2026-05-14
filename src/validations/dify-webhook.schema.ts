import { z } from 'zod';

export const difyWebhookSchema = z.object({
  event: z.string(),
  workflow_run_id: z.string(),
  task_id: z.string(),
  data: z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.string().min(1),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
    category_slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featured_image_prompt: z.string().optional(),
  }),
  signature: z.string().optional(),
});

export type DifyWebhookInput = z.infer<typeof difyWebhookSchema>;
