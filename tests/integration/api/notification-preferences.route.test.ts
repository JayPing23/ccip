/** @jest-environment node */

import { GET, PUT } from '@/app/api/notifications/preferences/route';
import { getPreferences, upsertPreference } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { INotificationPreference, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/notifications/notifications.service', () => ({
  getPreferences: jest.fn(),
  upsertPreference: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedGetPreferences = jest.mocked(getPreferences);
const mockedUpsertPreference = jest.mocked(upsertPreference);

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

const basePref: INotificationPreference = {
  user_id: 'user-1',
  org_id: 'org-1',
  in_app_enabled: true,
  email_enabled: true,
  email_digest: 'DAILY',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

function buildPutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/notifications/preferences', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('notification preferences routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/notifications/preferences ---

  describe('GET /api/notifications/preferences', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns user preferences', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetPreferences.mockResolvedValue([basePref]);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual([basePref]);
      expect(mockedGetPreferences).toHaveBeenCalledWith('user-1');
    });

    it('returns empty array when no preferences exist', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetPreferences.mockResolvedValue([]);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('returns 500 when service throws', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedGetPreferences.mockRejectedValue(new Error('db err'));

      const res = await GET();
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  // --- PUT /api/notifications/preferences ---

  describe('PUT /api/notifications/preferences', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );
      expect(res.status).toBe(401);
    });

    it('upserts a valid preference', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedUpsertPreference.mockResolvedValue(basePref);

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data).toEqual(basePref);
      expect(mockedUpsertPreference).toHaveBeenCalledWith('user-1', {
        orgId: 'org-1',
        inAppEnabled: true,
        emailEnabled: true,
        emailDigest: 'DAILY',
      });
    });

    it('validates orgId is required', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);

      const res = await PUT(
        buildPutRequest({
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.error.message).toBe('orgId is required');
    });

    it('validates orgId is non-empty string', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);

      const res = await PUT(
        buildPutRequest({
          orgId: '   ',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );

      expect(res.status).toBe(422);
    });

    it('validates inAppEnabled must be boolean', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: 'yes',
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.error.message).toBe('inAppEnabled must be a boolean');
    });

    it('validates emailEnabled must be boolean', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: 'no',
          emailDigest: 'DAILY',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.error.message).toBe('emailEnabled must be a boolean');
    });

    it('validates emailDigest must be a valid option', async () => {
      mockedGetCurrentUser.mockResolvedValue(testUser);

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'HOURLY',
        })
      );
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body.error.message).toContain('emailDigest must be one of');
    });

    it('accepts all valid digest options', async () => {
      for (const digest of ['IMMEDIATE', 'DAILY', 'WEEKLY', 'NONE']) {
        jest.clearAllMocks();
        mockedGetCurrentUser.mockResolvedValue(testUser);
        mockedUpsertPreference.mockResolvedValue({ ...basePref, email_digest: digest as never });

        const res = await PUT(
          buildPutRequest({
            orgId: 'org-1',
            inAppEnabled: true,
            emailEnabled: true,
            emailDigest: digest,
          })
        );

        expect(res.status).toBe(200);
      }
    });

    it('returns 500 when upsert throws', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(testUser);
      mockedUpsertPreference.mockRejectedValue(new Error('db fail'));

      const res = await PUT(
        buildPutRequest({
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      );

      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});
