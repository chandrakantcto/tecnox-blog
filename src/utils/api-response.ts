import { NextResponse } from 'next/server';
import type { PaginationMeta } from '@/types/api.types';
import { HTTP_STATUS, ERROR_CODES } from '@/constants/api.constants';

export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: PaginationMeta,
  status: number = HTTP_STATUS.OK
) {
  return NextResponse.json(
    { success: true, data, message, ...(pagination && { pagination }) },
    { status }
  );
}

export function createdResponse<T>(data: T, message = 'Created successfully') {
  return successResponse(data, message, undefined, HTTP_STATUS.CREATED);
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Array<{ field?: string; message: string }>
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details && { details }) } },
    { status }
  );
}

export function validationErrorResponse(
  details: Array<{ field?: string; message: string }>
) {
  return errorResponse(
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed',
    HTTP_STATUS.BAD_REQUEST,
    details
  );
}

export function unauthorizedResponse(message = 'Authentication required') {
  return errorResponse(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(message = 'Insufficient permissions') {
  return errorResponse(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
}

export function notFoundResponse(resource = 'Resource') {
  return errorResponse(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

export function conflictResponse(message = 'Resource already exists') {
  return errorResponse(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT);
}

export function internalErrorResponse(message = 'An unexpected error occurred') {
  return errorResponse(ERROR_CODES.INTERNAL_ERROR, message, HTTP_STATUS.INTERNAL_ERROR);
}

export function upstreamErrorResponse(message = 'External service error') {
  return errorResponse(ERROR_CODES.UPSTREAM_ERROR, message, HTTP_STATUS.BAD_GATEWAY);
}

export function zodErrorToDetails(issues: unknown[]) {
  return (issues as Array<{ path: (string | number)[]; message: string }>).map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}
