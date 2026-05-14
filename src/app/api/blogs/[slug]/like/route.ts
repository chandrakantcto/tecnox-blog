import { NextRequest } from 'next/server';
import { BlogService } from '@/services/blog.service';
import { successResponse, notFoundResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';

const blogService = new BlogService();

export const POST = withErrorHandling(
  async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const params = await context!.params;
    const { slug } = params;

    const blog = await blogService.getBySlug(slug);
    if (!blog) return notFoundResponse('Blog');

    const body = await request.json().catch(() => ({}));
    const liked = body.liked ?? true;

    await blogService.toggleLike(String(blog._id), liked);
    return successResponse({ liked }, 'Like updated');
  }
);
