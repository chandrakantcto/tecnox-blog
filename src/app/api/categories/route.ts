import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/services/category.service';
import { createCategorySchema } from '@/validations/category.schema';
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

const categoryService = new CategoryService();

export const GET = withErrorHandling(async () => {
  const categories = await categoryService.getAll(true);
  return successResponse(categories);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const body = await request.json();
  let validated;
  try {
    validated = createCategorySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(zodErrorToDetails(error.issues));
    }
    throw error;
  }

  try {
    const category = await categoryService.create(validated);
    return createdResponse(category, 'Category created successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return conflictResponse(error.message);
    }
    throw error;
  }
});
