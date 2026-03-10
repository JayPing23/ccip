/** @jest-environment node */

import { GET, PATCH } from '@/app/api/moderation/queue/route';
import { getReportQueue, reviewReport } from '@/modules/moderation/moderation.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IModerationReport } from '@/modules/moderation/types';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/moderation/moderation.service', () => ({
  getReportQueue: jest.fn(),
  reviewReport: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetReportQueue = jest.mocked(getReportQueue);
const mockedReviewReport = jest.mocked(reviewReport);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

const moderatorUser: IUser = {
  id: 'mod-1',
  email: 'mod@example.edu',
  display_name: 'Moderator',
  avatar_url: null,
  role_id: 'role-2',
  role_name: 'UNIVERSITY_EDITOR',
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

const report: IModerationReport = {
  id: 'report-1',
  reporter_id: 'user-1',
  content_type: 'THREAD',
  content_id: 'thread-1',
  reason: 'SPAM',
  description: null,
  status: 'PENDING',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
};

function buildRequest(url: string, method: 'GET' | 'PATCH', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('moderation queue routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // GET — access control
  // -----------------------------------------------------------------------

  it('rejects unauthenticated queue access', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await GET(buildRequest('http://localhost/api/moderation/queue', 'GET'));

    expect(response.status).toBe(401);
  });

  it('rejects non-moderator queue access', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    const response = await GET(buildRequest('http://localhost/api/moderation/queue', 'GET'));

    expect(response.status).toBe(403);
  });

  it('returns the report queue for moderators', async () => {
    mockedGetCurrentUser.mockResolvedValue(moderatorUser);
    mockedGetReportQueue.mockResolvedValue([report]);

    const response = await GET(buildRequest('http://localhost/api/moderation/queue', 'GET'));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe('report-1');
  });

  it('filters the queue by status', async () => {
    mockedGetCurrentUser.mockResolvedValue(moderatorUser);
    mockedGetReportQueue.mockResolvedValue([]);

    await GET(buildRequest('http://localhost/api/moderation/queue?status=DISMISSED', 'GET'));

    expect(mockedGetReportQueue).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DISMISSED' })
    );
  });

  // -----------------------------------------------------------------------
  // PATCH — review reports
  // -----------------------------------------------------------------------

  it('rejects non-moderator report review', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    const response = await PATCH(
      buildRequest('http://localhost/api/moderation/queue', 'PATCH', {
        report_id: 'report-1',
        status: 'REVIEWED',
      })
    );

    expect(response.status).toBe(403);
  });

  it('reviews a report as a moderator', async () => {
    mockedGetCurrentUser.mockResolvedValue(moderatorUser);
    mockedReviewReport.mockResolvedValue({ ...report, status: 'REVIEWED', reviewed_by: 'mod-1' });

    const response = await PATCH(
      buildRequest('http://localhost/api/moderation/queue', 'PATCH', {
        report_id: 'report-1',
        status: 'REVIEWED',
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.status).toBe('REVIEWED');
  });

  it('rejects invalid status values', async () => {
    mockedGetCurrentUser.mockResolvedValue(moderatorUser);

    const response = await PATCH(
      buildRequest('http://localhost/api/moderation/queue', 'PATCH', {
        report_id: 'report-1',
        status: 'INVALID',
      })
    );

    expect(response.status).toBe(422);
  });

  it('rejects missing fields', async () => {
    mockedGetCurrentUser.mockResolvedValue(moderatorUser);

    const response = await PATCH(
      buildRequest('http://localhost/api/moderation/queue', 'PATCH', {})
    );

    expect(response.status).toBe(422);
  });
});
