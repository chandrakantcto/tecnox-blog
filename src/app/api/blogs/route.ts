import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BlogService } from '@/services/blog.service';
import { createBlogSchema } from '@/validations/blog.schema';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const blogService = new BlogService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;

  const params = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    // Public pages send no param → default 'published'. Admin sends 'all' → no filter.
    status: searchParams.get('status') || 'published',
    category: searchParams.get('category') || undefined,
    tag: searchParams.get('tag') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || 'publishedAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    aiGenerated: searchParams.get('aiGenerated') === 'true' ? true : undefined,
  };

  const result = await blogService.list(params);
  return successResponse(result.blogs, undefined, result.pagination);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const body = await request.json();

  let validated;
  try {
    validated = createBlogSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(zodErrorToDetails(error.issues));
    }
    throw error;
  }

  const user = session.user as { id: string };
  const blog = await blogService.create(validated, user.id);
  return createdResponse(blog, 'Blog created successfully');
});
