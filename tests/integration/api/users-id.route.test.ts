/** @jest-environment node */

import { GET, PATCH } from '@/app/api/users/[id]/route';
import {
  changeUserRole,
  getCurrentUser,
  getUserById,
  updateUserProfile,
} from '@/modules/users/users.service';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/users/users.service', () => ({
  changeUserRole: jest.fn(),
  getCurrentUser: jest.fn(),
  getUserById: jest.fn(),
  updateUserProfile: jest.fn(),
}));

const mockedChangeUserRole = jest.mocked(changeUserRole);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedGetUserById = jest.mocked(getUserById);
const mockedUpdateUserProfile = jest.mocked(updateUserProfile);

const adminUser: IUser = {
  id: 'admin-1',
  email: 'admin@slu.edu.ph',
  display_name: 'Super Admin',
  avatar_url: null,
  role_id: 'role-admin',
  role_name: 'SUPER_ADMIN',
  org_id: 'org-1',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
};

const regularUser: IUser = {
  id: 'user-1',
  email: 'user@slu.edu.ph',
  display_name: 'Regular User',
  avatar_url: null,
  role_id: 'role-student',
  role_name: 'STUDENT',
  org_id: 'org-1',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
};

function buildRequest(method: 'GET' | 'PATCH', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/users/user-1', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ──────────────────────── GET /api/users/[id] ────────────────────────

describe('GET /api/users/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns user by id', async () => {
    mockedGetUserById.mockResolvedValue(regularUser);

    const response = await GET(buildRequest('GET'), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: regularUser, error: null });
    expect(mockedGetUserById).toHaveBeenCalledWith('user-1');
  });

  it('returns 404 for non-existent user', async () => {
    mockedGetUserById.mockResolvedValue(null);

    const response = await GET(buildRequest('GET'), {
      params: Promise.resolve({ id: 'missing-id' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'User not found', code: 'NOT_FOUND' },
    });
  });

  it('returns 500 when the service throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetUserById.mockRejectedValue(new Error('db error'));

    const response = await GET(buildRequest('GET'), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to fetch user', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

// ──────────────────── PATCH /api/users/[id] — role change ────────────────────

describe('PATCH /api/users/[id] — role change', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-editor' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 403 for STUDENT attempting role change', async () => {
    mockedGetCurrentUser.mockResolvedValue(regularUser);

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-editor' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Only admins can assign roles', code: 'FORBIDDEN' },
    });
  });

  it('returns 403 for DEPT_EDITOR attempting role change', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...adminUser,
      id: 'editor-1',
      role_name: 'DEPT_EDITOR',
    });

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-admin' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 403 for UNIVERSITY_EDITOR attempting role change', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...adminUser,
      id: 'uni-ed-1',
      role_name: 'UNIVERSITY_EDITOR',
    });

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-admin' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 403 when role_name is undefined', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: undefined });

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-editor' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 422 when role_id is missing', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await PATCH(buildRequest('PATCH', { role_id: '' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'role_id is required', code: 'VALIDATION_ERROR' },
    });
  });

  it('allows SUPER_ADMIN to change a user role', async () => {
    const updatedUser = {
      ...regularUser,
      role_id: 'role-editor',
      role_name: 'DEPT_EDITOR' as const,
    };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedChangeUserRole.mockResolvedValue(updatedUser);

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-editor' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: updatedUser, error: null });
    expect(mockedChangeUserRole).toHaveBeenCalledWith('user-1', 'role-editor');
  });

  it('returns 500 when changeUserRole throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedChangeUserRole.mockRejectedValue(new Error('role update failed'));

    const response = await PATCH(buildRequest('PATCH', { role_id: 'role-bad' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to update user', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

// ──────────────────── PATCH /api/users/[id] — profile update ────────────────────

describe('PATCH /api/users/[id] — profile update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await PATCH(buildRequest('PATCH', { display_name: 'Updated' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 403 when trying to update another users profile', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...regularUser, id: 'different-user' });

    const response = await PATCH(buildRequest('PATCH', { display_name: 'Sneaky Update' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'You can only update your own profile', code: 'FORBIDDEN' },
    });
  });

  it('returns 422 for invalid profile data (empty display_name)', async () => {
    mockedGetCurrentUser.mockResolvedValue(regularUser);

    const response = await PATCH(buildRequest('PATCH', { display_name: '' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Invalid user data', code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 422 for invalid avatar_url (not a URL)', async () => {
    mockedGetCurrentUser.mockResolvedValue(regularUser);

    const response = await PATCH(
      buildRequest('PATCH', { display_name: 'Valid Name', avatar_url: 'not-a-url' }),
      { params: Promise.resolve({ id: 'user-1' }) }
    );

    expect(response.status).toBe(422);
  });

  it('allows user to update their own profile', async () => {
    const updatedUser = { ...regularUser, display_name: 'New Name' };
    mockedGetCurrentUser.mockResolvedValue(regularUser);
    mockedUpdateUserProfile.mockResolvedValue(updatedUser);

    const response = await PATCH(buildRequest('PATCH', { display_name: 'New Name' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: updatedUser, error: null });
    expect(mockedUpdateUserProfile).toHaveBeenCalledWith('user-1', 'New Name', undefined);
  });

  it('allows user to update profile with avatar_url', async () => {
    const updatedUser = {
      ...regularUser,
      display_name: 'New Name',
      avatar_url: 'https://example.com/avatar.png',
    };
    mockedGetCurrentUser.mockResolvedValue(regularUser);
    mockedUpdateUserProfile.mockResolvedValue(updatedUser);

    const response = await PATCH(
      buildRequest('PATCH', {
        display_name: 'New Name',
        avatar_url: 'https://example.com/avatar.png',
      }),
      { params: Promise.resolve({ id: 'user-1' }) }
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateUserProfile).toHaveBeenCalledWith(
      'user-1',
      'New Name',
      'https://example.com/avatar.png'
    );
  });

  it('allows user to set avatar_url to null', async () => {
    const updatedUser = { ...regularUser, display_name: 'Keep Name', avatar_url: null };
    mockedGetCurrentUser.mockResolvedValue(regularUser);
    mockedUpdateUserProfile.mockResolvedValue(updatedUser);

    const response = await PATCH(
      buildRequest('PATCH', { display_name: 'Keep Name', avatar_url: null }),
      { params: Promise.resolve({ id: 'user-1' }) }
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateUserProfile).toHaveBeenCalledWith('user-1', 'Keep Name', null);
  });

  it('returns 500 when updateUserProfile throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetCurrentUser.mockResolvedValue(regularUser);
    mockedUpdateUserProfile.mockRejectedValue(new Error('profile update failed'));

    const response = await PATCH(buildRequest('PATCH', { display_name: 'Fail' }), {
      params: Promise.resolve({ id: 'user-1' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to update user', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});
