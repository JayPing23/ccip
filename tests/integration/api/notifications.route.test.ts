/** @jest-environment node */

import { GET, PATCH } from '@/app/api/notifications/route';
import { GET as unreadGET } from '@/app/api/notifications/unread/route';
import * as notificationsService from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/notifications/notifications.service', () => ({
  listNotifications: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedListNotifications = jest.mocked(notificationsService.listNotifications);
const mockedMarkAllRead = jest.mocked(notificationsService.markAllNotificationsAsRead);
const mockedGetUnreadCount = jest.mocked(notificationsService.getUnreadCount);

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

function buildRequest(url: string, method: 'GET' | 'PATCH' = 'GET') {
  return new NextRequest(url, { method });
}

describe('notification routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/notifications ---

  describe('GET /api/notifications', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const res = await GET(buildRequest('http://localhost/api/notifications'));
      expect(res.status).toBe(401);
    });

    it('returns paginated notifications', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      const res = await GET(buildRequest('http://localhost/api/notifications?page=1&pageSize=10'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.total).toBe(0);
      expect(mockedListNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', page: 1, pageSize: 10 })
      );
    });

    it('passes unreadOnly filter', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      await GET(buildRequest('http://localhost/api/notifications?unreadOnly=true'));

      expect(mockedListNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ unreadOnly: true })
      );
    });
  });

  // --- PATCH /api/notifications (mark all read) ---

  describe('PATCH /api/notifications', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const res = await PATCH();
      expect(res.status).toBe(401);
    });

    it('marks all as read and returns count', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedMarkAllRead.mockResolvedValue(5);

      const res = await PATCH();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.markedCount).toBe(5);
    });
  });

  // --- GET /api/notifications/unread ---

  describe('GET /api/notifications/unread', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const res = await unreadGET();
      expect(res.status).toBe(401);
    });

    it('returns unread summary', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetUnreadCount.mockResolvedValue({ unreadCount: 3, hasUnread: true });

      const res = await unreadGET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.unreadCount).toBe(3);
      expect(body.data.hasUnread).toBe(true);
    });

    it('returns hasUnread=false when count is 0', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetUnreadCount.mockResolvedValue({ unreadCount: 0, hasUnread: false });

      const res = await unreadGET();
      const body = await res.json();

      expect(body.data.hasUnread).toBe(false);
    });
  });

  // --- Error handling across all routes ---

  describe('error handling', () => {
    it('GET /api/notifications returns 500 on service failure', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockRejectedValue(new Error('db fail'));

      const res = await GET(buildRequest('http://localhost/api/notifications'));

      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('PATCH /api/notifications returns 500 on service failure', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedMarkAllRead.mockRejectedValue(new Error('db fail'));

      const res = await PATCH();

      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET /api/notifications/unread returns 500 on service failure', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetUnreadCount.mockRejectedValue(new Error('db fail'));

      const res = await unreadGET();

      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  // --- Pagination edge cases ---

  describe('pagination edge cases', () => {
    it('defaults to page 1 and pageSize 20', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      await GET(buildRequest('http://localhost/api/notifications'));

      expect(mockedListNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 20 })
      );
    });

    it('clamps pageSize to MAX_PAGE_SIZE (100)', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 100,
        totalPages: 0,
      });

      await GET(buildRequest('http://localhost/api/notifications?pageSize=500'));

      expect(mockedListNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 100 })
      );
    });

    it('clamps page to minimum 1', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedListNotifications.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      await GET(buildRequest('http://localhost/api/notifications?page=0'));

      expect(mockedListNotifications).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('supports any role accessing own notifications', async () => {
      for (const role of ['STUDENT', 'DEPT_EDITOR', 'UNIVERSITY_EDITOR', 'SUPER_ADMIN'] as const) {
        jest.clearAllMocks();
        mockedGetCurrentUser.mockResolvedValue({ ...testUser, role_name: role });
        mockedListNotifications.mockResolvedValue({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        });

        const res = await GET(buildRequest('http://localhost/api/notifications'));
        expect(res.status).toBe(200);
      }
    });
  });
});
