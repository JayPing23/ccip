/**
 * API Error Codes & HTTP Status Mappings
 * Standard error responses for all API routes
 */

import { NextResponse } from 'next/server';
import { errorResponse } from './api-response';

/**
 * API error definitions with HTTP status codes
 */
export const API_ERRORS = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 422 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  RATE_LIMIT: { code: 'RATE_LIMIT', status: 429 },
  INTERNAL_SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR', status: 500 },
} as const;

/**
 * Helper to return error response with correct HTTP status code
 * @example
 * return apiError('User not found', 'NOT_FOUND')
 */
export function apiError(message: string, errorType: keyof typeof API_ERRORS) {
  const error = API_ERRORS[errorType];
  return NextResponse.json(errorResponse(message, error.code), { status: error.status });
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorizedError(message = 'Authentication required') {
  return apiError(message, 'UNAUTHORIZED');
}

/**
 * Create a 403 Forbidden response
 */
export function forbiddenError(message = 'You do not have permission to access this resource') {
  return apiError(message, 'FORBIDDEN');
}

/**
 * Create a 404 Not Found response
 */
export function notFoundError(message = 'Resource not found') {
  return apiError(message, 'NOT_FOUND');
}

/**
 * Create a 422 Validation Error response
 */
export function validationError(message = 'Validation failed') {
  return apiError(message, 'VALIDATION_ERROR');
}

/**
 * Create a 500 Internal Server Error response
 */
export function internalError(message = 'An unexpected error occurred') {
  console.error('[Internal Error]', message);
  return apiError(message, 'INTERNAL_SERVER_ERROR');
}
