import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AITaskService } from '@/services/ai-task.service';
import { successResponse, unauthorizedResponse, notFoundResponse, upstreamErrorResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const aiTaskService = new AITaskService();

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const { taskId } = await request.json();
  if (!taskId) {
    return unauthorizedResponse('taskId is required');
  }

  try {
    const result = await aiTaskService.triggerManually(taskId);
    return successResponse(result, 'Workflow triggered successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return notFoundResponse('AI Task');
    }
    return upstreamErrorResponse(error instanceof Error ? error.message : 'Dify trigger failed');
  }
});
