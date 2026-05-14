import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/services/analytics.service';
import { successResponse, unauthorizedResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const analyticsService = new AnalyticsService();

export const GET = withErrorHandling(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const stats = await analyticsService.getDashboardStats();
  return successResponse(stats);
});
