import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MediaService } from '@/services/media.service';
import { successResponse, unauthorizedResponse, errorResponse } from '@/utils/api-response';
import { withErrorHandling } from '@/utils/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '@/constants/api.constants';

const mediaService = new MediaService();

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'No file provided', HTTP_STATUS.BAD_REQUEST);
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'File size exceeds 10MB', HTTP_STATUS.BAD_REQUEST);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF', HTTP_STATUS.BAD_REQUEST);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const user = session.user as { id: string };
  const media = await mediaService.upload(buffer, file.name, user.id);

  return successResponse(media, 'Image uploaded successfully');
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();

  const { publicId } = await request.json();
  if (!publicId) {
    return errorResponse(ERROR_CODES.VALIDATION_ERROR, 'publicId is required', HTTP_STATUS.BAD_REQUEST);
  }

  await mediaService.delete(publicId);
  return successResponse(null, 'Image deleted');
});
