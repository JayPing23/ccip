/** @jest-environment node */

import { GET, POST } from '@/app/api/users/route';
import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';
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

function buildRequest(url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

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

  it('returns 403 for STUDENT role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'STUDENT' });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('returns 403 for UNIVERSITY_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'UNIVERSITY_EDITOR' });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('returns 403 when role_name is undefined', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: undefined });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('returns 500 when db query throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const supabase = createSupabaseClientMock();
    const errorBuilder = createQueryBuilder<IUser[]>({
      data: null as unknown as IUser[],
      error: { message: 'db error' },
    });

    mockedGetCurrentUser.mockResolvedValue(adminUser);
    supabase.from.mockReturnValueOnce(errorBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to fetch users', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

// ──────────────────────── POST /api/users ────────────────────────

describe('POST /api/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: 'New User',
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'STUDENT' });

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: 'New User',
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Only admins can create users', code: 'FORBIDDEN' },
    });
  });

  it('returns 403 for DEPT_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'DEPT_EDITOR' });

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: 'New User',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 for UNIVERSITY_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'UNIVERSITY_EDITOR' });

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: 'New User',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid payload (empty display_name)', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: '',
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Invalid user data', code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 501 for valid payload (not implemented)', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await POST(
      buildRequest('http://localhost/api/users', 'POST', {
        display_name: 'New User',
      })
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Use auth signup instead', code: 'NOT_IMPLEMENTED' },
    });
  });
});
