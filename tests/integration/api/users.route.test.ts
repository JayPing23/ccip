/** @jest-environment node */

import { GET } from '@/app/api/users/route';
import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

const adminUser: IUser = {
  id: 'admin-1',
  email: 'admin@example.edu',
  display_name: 'Campus Admin',
  avatar_url: null,
  role_id: 'role-1',
  role_name: 'SUPER_ADMIN',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when the requester is unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns 403 when the requester is not an admin', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...adminUser,
      role_name: 'DEPT_EDITOR',
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Only admins can view all users', code: 'FORBIDDEN' },
    });
  });

  it('returns users for super admins', async () => {
    const supabase = createSupabaseClientMock();
    const users = [adminUser];
    const usersBuilder = createQueryBuilder<IUser[]>({ data: users, error: null });

    mockedGetCurrentUser.mockResolvedValue(adminUser);
    supabase.from.mockReturnValueOnce(usersBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: users, error: null });
    expect(usersBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
