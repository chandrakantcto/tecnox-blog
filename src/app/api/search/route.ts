import { NextRequest } from 'next/server';
import { SearchService } from '@/services/search.service';
import { successResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const searchService = new SearchService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const result = await searchService.search(query, page, limit);
  return successResponse(result.results, undefined, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    hasNextPage: page * limit < result.total,
    hasPrevPage: page > 1,
  });
});
