import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/services/category.service';
import { updateCategorySchema } from '@/validations/category.schema';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
  errorResponse,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';
import { HTTP_STATUS, ERROR_CODES } from '@/constants/api.constants';

const categoryService = new CategoryService();

export const GET = withErrorHandling(
  async (_req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const params = await context!.params;
    const category = await categoryService.getById(params.id);
    if (!category) return notFoundResponse('Category');
    return successResponse(category);
  }
);

export const PUT = withErrorHandling(
  async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const body = await request.json();

    let validated;
    try {
      validated = updateCategorySchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(zodErrorToDetails(error.issues));
      }
      throw error;
    }

    const updated = await categoryService.update(params.id, validated);
    if (!updated) return notFoundResponse('Category');
    return successResponse(updated, 'Category updated');
  }
);

export const DELETE = withErrorHandling(
  async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const { searchParams } = request.nextUrl;
    const force = searchParams.get('force') === 'true';

    try {
      const deleted = await categoryService.delete(params.id, force);
      if (!deleted) return notFoundResponse('Category');
      return successResponse(null, 'Category deleted');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return errorResponse(ERROR_CODES.UNPROCESSABLE, error.message, HTTP_STATUS.UNPROCESSABLE);
      }
      throw error;
    }
  }
);
