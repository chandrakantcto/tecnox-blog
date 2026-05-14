import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TagService } from '@/services/tag.service';
import { updateTagSchema } from '@/validations/tag.schema';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const tagService = new TagService();

export const PUT = withErrorHandling(
  async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const body = await request.json();

    let validated;
    try {
      validated = updateTagSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(zodErrorToDetails(error.issues));
      }
      throw error;
    }

    const updated = await tagService.update(params.id, validated);
    if (!updated) return notFoundResponse('Tag');
    return successResponse(updated, 'Tag updated');
  }
);

export const DELETE = withErrorHandling(
  async (_req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    await tagService.delete(params.id);
    return successResponse(null, 'Tag deleted');
  }
);
