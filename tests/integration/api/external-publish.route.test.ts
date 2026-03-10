/** @jest-environment node */

import { GET, POST } from '@/app/api/external-publish/route';
import * as externalPublishService from '@/modules/external_publish/external_publish.service';
import type { IExternalPublishTarget } from '@/modules/external_publish/types';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/external_publish/external_publish.service', () => ({
  createExternalPublishTargets: jest.fn(),
  getExternalPublishSummary: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock rate limiter to avoid interfering with tests
jest.mock('@/shared/utils/rate-limit', () => ({
  externalPublishCreateLimiter: { check: jest.fn().mockReturnValue(null) },
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedCreateTargets = jest.mocked(externalPublishService.createExternalPublishTargets);
const mockedGetSummary = jest.mocked(externalPublishService.getExternalPublishSummary);

const adminUser: IUser = {
  id: 'admin-1',
  email: 'admin@example.edu',
  display_name: 'Admin',
  avatar_url: null,
  role_id: 'role-4',
  role_name: 'SUPER_ADMIN',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const studentUser: IUser = {
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

const sampleTarget: IExternalPublishTarget = {
  id: 'target-1',
  content_id: 'content-1',
  content_type: 'ANNOUNCEMENT',
  platform: 'facebook',
  external_post_id: null,
  status: 'PENDING',
  error_log: null,
  retry_count: 0,
  max_retries: 3,
  next_retry_at: null,
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

describe('external publish routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/external-publish ---

  describe('GET /api/external-publish', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-crosspost users', async () => {
      mockedGetCurrentUser.mockResolvedValue(studentUser);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns external publish summary for admin', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetSummary.mockResolvedValue({
        total: 1,
        pending: 1,
        posted: 0,
        failed: 0,
        targets: [sampleTarget],
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.total).toBe(1);
      expect(json.data.pending).toBe(1);
    });
  });

  // --- POST /api/external-publish ---

  describe('POST /api/external-publish', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platforms: ['facebook'],
        })
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-crosspost users', async () => {
      mockedGetCurrentUser.mockResolvedValue(studentUser);
      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platforms: ['facebook'],
        })
      );
      expect(res.status).toBe(403);
    });

    it('validates content_type', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'THREAD',
          platforms: ['facebook'],
        })
      );
      expect(res.status).toBe(422);
    });

    it('validates platforms array', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platforms: [],
        })
      );
      expect(res.status).toBe(422);
    });

    it('rejects invalid platform values', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platforms: ['twitter'],
        })
      );
      expect(res.status).toBe(422);
    });

    it('creates external publish targets', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedCreateTargets.mockResolvedValue([sampleTarget]);

      const res = await POST(
        buildRequest('http://localhost/api/external-publish', 'POST', {
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platforms: ['facebook'],
        })
      );
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].platform).toBe('facebook');
      expect(mockedCreateTargets).toHaveBeenCalledWith('content-1', 'ANNOUNCEMENT', ['facebook']);
    });
  });
});
