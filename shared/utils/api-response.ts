/**
 * Standard API Response Format
 * All API routes MUST return responses in this format
 */

/**
 * Standard response wrapper for all API endpoints
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Error object structure
 */
export interface ApiError {
  message: string;
  code: string;
}

/**
 * Create a success response
 * @example
 * return NextResponse.json(successResponse({ id: '123', name: 'Test' }))
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

/**
 * Create an error response
 * @example
 * return NextResponse.json(errorResponse('Invalid input', 'VALIDATION_ERROR'), { status: 422 })
 */
export function errorResponse(message: string, code: string): ApiResponse<null> {
  return { data: null, error: { message, code } };
}
