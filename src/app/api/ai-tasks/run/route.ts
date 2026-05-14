import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AITaskService } from '@/services/ai-task.service';
import { successResponse, unauthorizedResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const aiTaskService = new AITaskService();

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Allow both authenticated users and cron jobs (via secret header)
  const cronSecret = request.headers.get('x-cron-secret');
  const isCronJob = cronSecret === process.env.CRON_SECRET;

  if (!isCronJob) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();
  }

  const count = await aiTaskService.enqueueAllPending();
  return successResponse({ queued: count }, `Enqueued ${count} pending tasks`);
});
