import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AITaskService } from '@/services/ai-task.service';
import { createAITaskSchema } from '@/validations/ai-task.schema';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const aiTaskService = new AITaskService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const params = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const result = await aiTaskService.list(params);
  return successResponse(result.tasks, undefined, result.pagination);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const body = await request.json();
  let validated;
  try {
    validated = createAITaskSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(zodErrorToDetails(error.issues));
    }
    throw error;
  }

  const user = session.user as { id: string };
  const task = await aiTaskService.create(validated, user.id);
  return createdResponse(task, 'AI task created and queued');
});
