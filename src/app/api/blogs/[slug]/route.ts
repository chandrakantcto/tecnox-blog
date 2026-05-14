import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BlogService } from '@/services/blog.service';
import { updateBlogSchema } from '@/validations/blog.schema';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
  zodErrorToDetails,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const blogService = new BlogService();

export const GET = withErrorHandling(
  async (_request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const params = await context!.params;
    const { slug } = params;

    const blog = await blogService.getBySlug(slug);
    if (!blog) return notFoundResponse('Blog');

    await blogService.incrementViews(String(blog._id));
    return successResponse(blog);
  }
);

export const PUT = withErrorHandling(
  async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const { slug } = params;

    const blog = await blogService.getBySlug(slug) || await blogService.getById(slug);
    if (!blog) return notFoundResponse('Blog');

    const body = await request.json();
    let validated;
    try {
      validated = updateBlogSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(zodErrorToDetails(error.issues));
      }
      throw error;
    }

    const user = session.user as { id: string };
    const updated = await blogService.update(String(blog._id), validated, user.id);
    return successResponse(updated, 'Blog updated successfully');
  }
);

export const DELETE = withErrorHandling(
  async (_request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const params = await context!.params;
    const { slug } = params;

    const blog = await blogService.getBySlug(slug) || await blogService.getById(slug);
    if (!blog) return notFoundResponse('Blog');

    await blogService.delete(String(blog._id));
    return successResponse(null, 'Blog deleted successfully');
  }
);
