import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AITaskService } from '@/services/ai-task.service';
import { successResponse, notFoundResponse, unauthorizedResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const aiTaskService = new AITaskService();

export const POST = withErrorHandling(
  async (_req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const task = await aiTaskService.retry(params.id);
    if (!task) return notFoundResponse('AI Task');
    return successResponse(task, 'Task requeued for retry');
  }
);
