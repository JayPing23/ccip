/** @jest-environment node */

import { GET, PATCH, POST } from '@/app/api/admin/retention/route';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IUser } from '@/shared/types/database.types';
import type { IRetentionPolicy, RetentionSummary } from '@/shared/utils/retention';
import * as retention from '@/shared/utils/retention';
import { NextRequest } from 'next/server';

jest.mock('@/shared/utils/retention', () => ({
  getRetentionPolicies: jest.fn(),
  getRetentionCandidates: jest.fn(),
  updateRetentionPolicy: jest.fn(),
  archiveStaleContent: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedGetRetentionPolicies = jest.mocked(retention.getRetentionPolicies);
const mockedGetRetentionCandidates = jest.mocked(retention.getRetentionCandidates);
const mockedUpdateRetentionPolicy = jest.mocked(retention.updateRetentionPolicy);
const mockedArchiveStaleContent = jest.mocked(retention.archiveStaleContent);

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

const editorUser: IUser = {
  id: 'user-2',
  email: 'editor@example.edu',
  display_name: 'Editor',
  avatar_url: null,
  role_id: 'role-2',
  role_name: 'DEPT_EDITOR',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const universityEditorUser: IUser = {
  id: 'user-3',
  email: 'unieditor@example.edu',
  display_name: 'Uni Editor',
  avatar_url: null,
  role_id: 'role-3',
  role_name: 'UNIVERSITY_EDITOR',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const samplePolicy: IRetentionPolicy = {
  id: 'policy-1',
  content_type: 'ANNOUNCEMENT',
  stale_after_days: 90,
  auto_archive_after_days: 180,
  enabled: true,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const sampleCandidates: RetentionSummary = {
  totalStale: 2,
  totalArchivable: 1,
  candidates: [
    {
      id: 'content-1',
      content_type: 'ANNOUNCEMENT',
      title: 'Old Announcement',
      status: 'PUBLISHED',
      last_activity_at: '2025-06-01T00:00:00.000Z',
      age_days: 280,
      recommended_action: 'ARCHIVE',
    },
    {
      id: 'content-2',
      content_type: 'ARTICLE',
      title: 'Stale Article',
      status: 'PUBLISHED',
      last_activity_at: '2025-09-01T00:00:00.000Z',
      age_days: 190,
      recommended_action: 'FLAG_STALE',
    },
  ],
};

function buildRequest(
  url: string,
  method: 'GET' | 'PATCH' | 'POST',
  body?: Record<string, unknown>
) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('admin retention routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/admin/retention ---

  describe('GET /api/admin/retention', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 for non-admin users (STUDENT)', async () => {
      mockedGetCurrentUser.mockResolvedValue(studentUser);
      const res = await GET();
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 403 for DEPT_EDITOR', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns 403 for UNIVERSITY_EDITOR', async () => {
      mockedGetCurrentUser.mockResolvedValue(universityEditorUser);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns 403 when user has no role_name', async () => {
      const noRoleUser = { ...adminUser, role_name: null } as unknown as IUser;
      mockedGetCurrentUser.mockResolvedValue(noRoleUser);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('returns retention policies and candidates for admin', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockResolvedValue([samplePolicy]);
      mockedGetRetentionCandidates.mockResolvedValue(sampleCandidates);

      const res = await GET();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.policies).toHaveLength(1);
      expect(json.data.policies[0].content_type).toBe('ANNOUNCEMENT');
      expect(json.data.policies[0].stale_after_days).toBe(90);
      expect(json.data.policies[0].auto_archive_after_days).toBe(180);
      expect(json.data.policies[0].enabled).toBe(true);
      expect(json.data.candidates.totalStale).toBe(2);
      expect(json.data.candidates.totalArchivable).toBe(1);
      expect(json.data.candidates.candidates).toHaveLength(2);
    });

    it('returns empty data when no policies or candidates exist', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockResolvedValue([]);
      mockedGetRetentionCandidates.mockResolvedValue({
        totalStale: 0,
        totalArchivable: 0,
        candidates: [],
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.policies).toHaveLength(0);
      expect(json.data.candidates.totalStale).toBe(0);
      expect(json.data.candidates.totalArchivable).toBe(0);
      expect(json.data.candidates.candidates).toHaveLength(0);
    });

    it('returns 500 when getRetentionPolicies throws', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockRejectedValue(new Error('DB connection error'));

      const res = await GET();
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('returns 500 when getRetentionCandidates throws', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockResolvedValue([samplePolicy]);
      mockedGetRetentionCandidates.mockRejectedValue(new Error('DB connection error'));

      const res = await GET();
      expect(res.status).toBe(500);
    });

    it('calls both getRetentionPolicies and getRetentionCandidates in parallel', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockResolvedValue([]);
      mockedGetRetentionCandidates.mockResolvedValue({
        totalStale: 0,
        totalArchivable: 0,
        candidates: [],
      });

      await GET();

      expect(mockedGetRetentionPolicies).toHaveBeenCalledTimes(1);
      expect(mockedGetRetentionCandidates).toHaveBeenCalledTimes(1);
    });

    it('response has correct structure with data and null error on success', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedGetRetentionPolicies.mockResolvedValue([samplePolicy]);
      mockedGetRetentionCandidates.mockResolvedValue(sampleCandidates);

      const res = await GET();
      const json = await res.json();

      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('error', null);
      expect(json.data).toHaveProperty('policies');
      expect(json.data).toHaveProperty('candidates');
    });
  });

  // --- PATCH /api/admin/retention ---

  describe('PATCH /api/admin/retention', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', { id: 'policy-1' })
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin users', async () => {
      mockedGetCurrentUser.mockResolvedValue(studentUser);
      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', { id: 'policy-1' })
      );
      expect(res.status).toBe(403);
    });

    it('returns 403 for DEPT_EDITOR', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);
      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', { id: 'policy-1' })
      );
      expect(res.status).toBe(403);
    });

    it('validates policy id is required', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await PATCH(buildRequest('http://localhost/api/admin/retention', 'PATCH', {}));
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('Policy id is required');
    });

    it('validates id must be a string', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', { id: 123 })
      );
      expect(res.status).toBe(422);
    });

    it('validates stale_after_days must be a positive integer', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);

      // Zero
      let res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 0,
        })
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('stale_after_days must be a positive integer');

      // Negative
      res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: -5,
        })
      );
      expect(res.status).toBe(422);

      // String
      res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 'abc',
        })
      );
      expect(res.status).toBe(422);
    });

    it('validates auto_archive_after_days must be positive integer or null', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);

      // Zero
      let res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          auto_archive_after_days: 0,
        })
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('auto_archive_after_days must be a positive integer or null');

      // Negative
      res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          auto_archive_after_days: -10,
        })
      );
      expect(res.status).toBe(422);

      // String
      res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          auto_archive_after_days: 'never',
        })
      );
      expect(res.status).toBe(422);
    });

    it('allows auto_archive_after_days to be null', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue({
        ...samplePolicy,
        auto_archive_after_days: null,
      });

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          auto_archive_after_days: null,
        })
      );
      expect(res.status).toBe(200);
    });

    it('validates enabled must be a boolean', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);

      // String
      let res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          enabled: 'true',
        })
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('enabled must be a boolean');

      // Number
      res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          enabled: 1,
        })
      );
      expect(res.status).toBe(422);
    });

    it('updates a retention policy with stale_after_days', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue({
        ...samplePolicy,
        stale_after_days: 120,
      });

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 120,
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.stale_after_days).toBe(120);
      expect(mockedUpdateRetentionPolicy).toHaveBeenCalledWith('policy-1', {
        stale_after_days: 120,
      });
    });

    it('updates enabled field only', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue({
        ...samplePolicy,
        enabled: false,
      });

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          enabled: false,
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.enabled).toBe(false);
      expect(mockedUpdateRetentionPolicy).toHaveBeenCalledWith('policy-1', { enabled: false });
    });

    it('updates multiple fields at once', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue({
        ...samplePolicy,
        stale_after_days: 60,
        auto_archive_after_days: 120,
        enabled: false,
      });

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 60,
          auto_archive_after_days: 120,
          enabled: false,
        })
      );
      expect(res.status).toBe(200);

      expect(mockedUpdateRetentionPolicy).toHaveBeenCalledWith('policy-1', {
        stale_after_days: 60,
        auto_archive_after_days: 120,
        enabled: false,
      });
    });

    it('returns 500 when updateRetentionPolicy returns null', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue(null);

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 120,
        })
      );
      expect(res.status).toBe(500);
    });

    it('returns 500 when updateRetentionPolicy throws', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockRejectedValue(new Error('Unexpected error'));

      const res = await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 120,
        })
      );
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('only includes provided fields in the update', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedUpdateRetentionPolicy.mockResolvedValue(samplePolicy);

      await PATCH(
        buildRequest('http://localhost/api/admin/retention', 'PATCH', {
          id: 'policy-1',
          stale_after_days: 120,
        })
      );

      // Should NOT include enabled or auto_archive_after_days
      expect(mockedUpdateRetentionPolicy).toHaveBeenCalledWith('policy-1', {
        stale_after_days: 120,
      });
    });
  });

  // --- POST /api/admin/retention ---

  describe('POST /api/admin/retention', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin (STUDENT)', async () => {
      mockedGetCurrentUser.mockResolvedValue(studentUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(403);
    });

    it('returns 403 for DEPT_EDITOR', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(403);
    });

    it('validates content_type is required', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('content_type must be ANNOUNCEMENT, ARTICLE, or THREAD');
    });

    it('validates content_type must be a valid type', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'INVALID',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(422);
    });

    it('validates ids array cannot be empty', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: [],
        })
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error.message).toBe('ids must be a non-empty array of strings');
    });

    it('validates ids must be an array', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: 'not-an-array',
        })
      );
      expect(res.status).toBe(422);
    });

    it('validates ids must contain strings only', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: [123, 456],
        })
      );
      expect(res.status).toBe(422);
    });

    it('validates ids is required', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
        })
      );
      expect(res.status).toBe(422);
    });

    it('archives stale announcements', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockResolvedValue(2);

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1', 'content-2'],
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.archived).toBe(2);
      expect(mockedArchiveStaleContent).toHaveBeenCalledWith('ANNOUNCEMENT', [
        'content-1',
        'content-2',
      ]);
    });

    it('archives stale articles', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockResolvedValue(1);

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ARTICLE',
          ids: ['article-1'],
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.archived).toBe(1);
      expect(mockedArchiveStaleContent).toHaveBeenCalledWith('ARTICLE', ['article-1']);
    });

    it('archives stale threads', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockResolvedValue(3);

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'THREAD',
          ids: ['thread-1', 'thread-2', 'thread-3'],
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.archived).toBe(3);
      expect(mockedArchiveStaleContent).toHaveBeenCalledWith('THREAD', [
        'thread-1',
        'thread-2',
        'thread-3',
      ]);
    });

    it('returns 500 when archiveStaleContent throws', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockRejectedValue(new Error('DB error'));

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('response has correct structure on success', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockResolvedValue(1);

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );

      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('error', null);
      expect(json.data).toHaveProperty('archived');
    });

    it('handles archiving a single item', async () => {
      mockedGetCurrentUser.mockResolvedValue(adminUser);
      mockedArchiveStaleContent.mockResolvedValue(1);

      const res = await POST(
        buildRequest('http://localhost/api/admin/retention', 'POST', {
          content_type: 'ANNOUNCEMENT',
          ids: ['content-1'],
        })
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.archived).toBe(1);
    });
  });
});
