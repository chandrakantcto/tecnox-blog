import { z } from 'zod';

export const createAITaskSchema = z.object({
  contentType:  z.enum(['Product', 'Category', 'How-To', 'Listicle', 'General']),
  keywords:     z.array(z.string().min(1)).min(1, 'At least one keyword is required').max(20),
  targetUrl:    z.string().url().optional().or(z.literal('')),
  productName:  z.string().max(200).optional(),

  /**
   * ISO-8601 datetime string from the form's <input type="datetime-local">.
   * Stored as `scheduledAt` in MongoDB.
   * If omitted or in the past the task runs immediately.
   */
  schedule_datetime: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal('')),

  // Static Dify payload fields — passed through and stored on the task.
  response_mode: z.string().optional(),
  user:          z.string().optional(),
});

export const updateAITaskSchema = createAITaskSchema.partial();

export type CreateAITaskInput = z.infer<typeof createAITaskSchema>;
export type UpdateAITaskInput = z.infer<typeof updateAITaskSchema>;
