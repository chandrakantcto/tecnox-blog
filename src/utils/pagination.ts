import type { PaginationMeta } from '@/types/api.types';
import { BLOG_DEFAULTS } from '@/constants/blog.constants';

export function buildPagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): { page: number; limit: number; skip: number } {
  const rawPage = searchParams instanceof URLSearchParams
    ? searchParams.get('page')
    : searchParams['page'];
  const rawLimit = searchParams instanceof URLSearchParams
    ? searchParams.get('limit')
    : searchParams['limit'];

  const page = Math.max(1, parseInt(String(rawPage || '1'), 10) || 1);
  const limit = Math.min(
    BLOG_DEFAULTS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(String(rawLimit || '10'), 10) || 10)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
