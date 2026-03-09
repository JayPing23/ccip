/** @jest-environment node */

import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { errorResponse, successResponse } from '@/shared/utils/api-response';

describe('api helpers', () => {
  it('wraps successful payloads in the standard response format', () => {
    expect(successResponse({ id: '123' })).toEqual({
      data: { id: '123' },
      error: null,
    });
  });

  it('wraps error payloads in the standard response format', () => {
    expect(errorResponse('No access', 'FORBIDDEN')).toEqual({
      data: null,
      error: { message: 'No access', code: 'FORBIDDEN' },
    });
  });

  it('creates typed HTTP error responses', async () => {
    await expect(unauthorizedError('Auth required').json()).resolves.toEqual({
      data: null,
      error: { message: 'Auth required', code: 'UNAUTHORIZED' },
    });
    await expect(forbiddenError('No access').json()).resolves.toEqual({
      data: null,
      error: { message: 'No access', code: 'FORBIDDEN' },
    });
    await expect(notFoundError('Missing').json()).resolves.toEqual({
      data: null,
      error: { message: 'Missing', code: 'NOT_FOUND' },
    });
    await expect(validationError('Bad input').json()).resolves.toEqual({
      data: null,
      error: { message: 'Bad input', code: 'VALIDATION_ERROR' },
    });
  });

  it('logs internal errors and returns a 500 payload', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = internalError('Unexpected failure');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Unexpected failure', code: 'INTERNAL_SERVER_ERROR' },
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Internal Error]', 'Unexpected failure');
  });
});
