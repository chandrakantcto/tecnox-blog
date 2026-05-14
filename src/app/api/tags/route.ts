import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TagService } from '@/services/tag.service';
import { createTagSchema } from '@/validations/tag.schema';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
  conflictResponse,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const tagService = new TagService();

export const GET = withErrorHandling(async () => {
  const tags = await tagService.getAll();
  return successResponse(tags);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const body = await request.json();
  let validated;
  try {
    validated = createTagSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(zodErrorToDetails(error.issues));
    }
    throw error;
  }

  try {
    const tag = await tagService.create(validated);
    return createdResponse(tag, 'Tag created successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return conflictResponse(error.message);
    }
    throw error;
  }
});
