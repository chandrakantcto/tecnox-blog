import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { validationErrorResponse, internalErrorResponse, zodErrorToDetails } from './api-response';

export function withErrorHandling(
  handler: (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(zodErrorToDetails(error.issues));
      }

      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          return validationErrorResponse([{ message: error.message }]);
        }
        if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
          return NextResponse.json(
            { success: false, error: { code: 'CONFLICT', message: 'Resource already exists' } },
            { status: 409 }
          );
        }
      }

      console.error('[API Error]', error);
      return internalErrorResponse();
    }
  };
}
