/**
 * GET    /api/admin/blogs/[id]  — fetch single blog by MongoDB ObjectId
 * PUT    /api/admin/blogs/[id]  — update blog
 * DELETE /api/admin/blogs/[id]  — delete blog
 */
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BlogService } from '@/services/blog.service';
import { updateBlogSchema } from '@/validations/blog.schema';
import {
  successResponse, notFoundResponse,
  unauthorizedResponse, validationErrorResponse, zodErrorToDetails,
} from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { ZodError } from 'zod';

const blogService = new BlogService();

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  async (_req: NextRequest, context?: RouteContext) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { id } = await context!.params;
    const blog = await blogService.getById(id);
    if (!blog) return notFoundResponse('Blog');

    return successResponse(blog);
  },
);

export const PUT = withErrorHandling(
  async (request: NextRequest, context?: RouteContext) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { id } = await context!.params;
    const blog = await blogService.getById(id);
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
    const updated = await blogService.update(id, validated, user.id);
    return successResponse(updated, 'Blog updated successfully');
  },
);

export const DELETE = withErrorHandling(
  async (_req: NextRequest, context?: RouteContext) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { id } = await context!.params;
    const blog = await blogService.getById(id);
    if (!blog) return notFoundResponse('Blog');

    await blogService.delete(id);
    return successResponse(null, 'Blog deleted successfully');
  },
);
