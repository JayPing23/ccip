/** @jest-environment node */

import { GET } from '@/app/api/auth/me/route';
import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';
import { asServerSupabaseClient, createSupabaseClientMock } from '../../helpers/supabase';

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

const currentUser: IUser = {
  id: 'user-1',
  email: 'user@example.edu',
  display_name: 'Campus User',
  avatar_url: null,
  role_id: 'role-1',
  role_name: 'DEPT_EDITOR',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated session exists', async () => {
    const supabase = createSupabaseClientMock();

    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
    });
  });

  it('returns 401 when the session exists but the profile is missing', async () => {
    const supabase = createSupabaseClientMock();

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'User profile not found', code: 'UNAUTHORIZED' },
    });
  });

  it('returns the current user profile when authenticated', async () => {
    const supabase = createSupabaseClientMock();

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: currentUser, error: null });
  });
});
