/** @jest-environment node */

import { GET } from '@/app/api/roles/route';
import { getAllRoles } from '@/modules/roles/roles.service';
import type { IRole } from '@/shared/types/database.types';

jest.mock('@/modules/roles/roles.service', () => ({
  getAllRoles: jest.fn(),
}));

const mockedGetAllRoles = jest.mocked(getAllRoles);

describe('GET /api/roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the public role list', async () => {
    const roles: IRole[] = [
      { id: '1', name: 'STUDENT', created_at: '2026-03-09T10:00:00.000Z' },
      { id: '2', name: 'SUPER_ADMIN', created_at: '2026-03-09T10:00:00.000Z' },
    ];

    mockedGetAllRoles.mockResolvedValue(roles);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: roles, error: null });
  });

  it('returns a 500 response when the role service fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetAllRoles.mockRejectedValue(new Error('database unavailable'));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to fetch roles', code: 'INTERNAL_SERVER_ERROR' },
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
