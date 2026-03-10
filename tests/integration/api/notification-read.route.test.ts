/** @jest-environment node */

import { PATCH } from '@/app/api/notifications/[id]/read/route';
import { markNotificationAsRead } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { INotification, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/notifications/notifications.service', () => ({
  markNotificationAsRead: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedMarkRead = jest.mocked(markNotificationAsRead);

const testUser: IUser = {
  id: 'user-1',
  email: 'student@example.edu',
  display_name: 'Student',
  avatar_url: null,
  role_id: 'role-1',
  role_name: 'STUDENT',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const baseNotification: INotification = {
  id: 'notif-1',
  user_id: 'user-1',
  content_id: 'content-1',
  type: 'IN_APP',
  notification_text: 'Test notification',
  read_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
};

function buildRequest() {
  return new NextRequest('http://localhost/api/notifications/notif-1/read', { method: 'PATCH' });
}

describe('PATCH /api/notifications/[id]/read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const res = await PATCH(buildRequest(), {
      params: Promise.resolve({ id: 'notif-1' }),
    });

    expect(res.status).toBe(401);
  });

  it('marks a notification as read', async () => {
    mockedGetCurrentUser.mockResolvedValue(testUser);
    mockedMarkRead.mockResolvedValue({
      ...baseNotification,
      read_at: '2026-03-09T12:00:00.000Z',
    });

    const res = await PATCH(buildRequest(), {
      params: Promise.resolve({ id: 'notif-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.read_at).toBe('2026-03-09T12:00:00.000Z');
    expect(mockedMarkRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('returns 404 when notification not found (PGRST116)', async () => {
    mockedGetCurrentUser.mockResolvedValue(testUser);
    mockedMarkRead.mockRejectedValue(new Error('PGRST116: not found'));

    const res = await PATCH(buildRequest(), {
      params: Promise.resolve({ id: 'missing-id' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.message).toBe('Notification not found');
  });

  it('returns 500 on unexpected error', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetCurrentUser.mockResolvedValue(testUser);
    mockedMarkRead.mockRejectedValue(new Error('unexpected db error'));

    const res = await PATCH(buildRequest(), {
      params: Promise.resolve({ id: 'notif-1' }),
    });

    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });

  it('enforces user-scoped access (passes user id to service)', async () => {
    const adminUser = { ...testUser, id: 'admin-1', role_name: 'SUPER_ADMIN' as const };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedMarkRead.mockResolvedValue({
      ...baseNotification,
      read_at: '2026-03-09T12:00:00.000Z',
    });

    await PATCH(buildRequest(), { params: Promise.resolve({ id: 'notif-1' }) });

    // Service receives admin's user id, not a generic bypass — RLS at DB level enforces
    // that user_id must match, so service passes user's own id
    expect(mockedMarkRead).toHaveBeenCalledWith('notif-1', 'admin-1');
  });
});
