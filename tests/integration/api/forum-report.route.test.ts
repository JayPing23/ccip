/** @jest-environment node */

import { POST } from '@/app/api/forum/threads/[id]/report/route';
import { createReport } from '@/modules/moderation/moderation.service';
import { getThreadById } from '@/modules/forum/forum.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { forumReportCreateLimiter } from '@/shared/utils/rate-limit';
import type { IForumThread } from '@/modules/forum/types';
import type { IModerationReport } from '@/modules/moderation/types';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/moderation/moderation.service', () => ({
  createReport: jest.fn(),
}));

jest.mock('@/modules/forum/forum.service', () => ({
  getThreadById: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedCreateReport = jest.mocked(createReport);
const mockedGetThreadById = jest.mocked(getThreadById);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

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

const thread: IForumThread = {
  id: 'thread-1',
  category_id: 'cat-1',
  author_id: 'user-2',
  title: 'Spam post',
  body: 'Buy my stuff',
  slug: 'spam-post',
  status: 'OPEN',
  pinned: false,
  reply_count: 0,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  deleted_at: null,
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

function buildRequest(url: string, method: 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const routeParams = { params: Promise.resolve({ id: 'thread-1' }) };

describe('forum report route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a report for a thread', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(thread);
    mockedCreateReport.mockResolvedValue(report);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'SPAM',
      }),
      routeParams
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data.id).toBe('report-1');
  });

  it('rejects unauthenticated reports', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'SPAM',
      }),
      routeParams
    );

    expect(response.status).toBe(401);
  });

  it('rejects invalid report reason', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(thread);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'NONSENSE',
      }),
      routeParams
    );

    expect(response.status).toBe(422);
  });

  it('returns 404 for missing thread', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'SPAM',
      }),
      routeParams
    );

    expect(response.status).toBe(404);
  });

  it('rate-limits report creation', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    const spy = jest.spyOn(forumReportCreateLimiter, 'check');
    spy.mockReturnValueOnce(
      new (await import('next/server')).NextResponse(
        JSON.stringify({ data: null, error: { message: 'Too many requests', code: 'RATE_LIMIT' } }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      )
    );

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'SPAM',
      }),
      routeParams
    );

    expect(response.status).toBe(429);
    spy.mockRestore();
  });

  it('supports reporting a reply within a thread', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(thread);
    mockedCreateReport.mockResolvedValue({
      ...report,
      content_type: 'REPLY',
      content_id: 'reply-1',
    });

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/report', 'POST', {
        reason: 'HARASSMENT',
        reply_id: 'reply-1',
      }),
      routeParams
    );

    expect(response.status).toBe(201);
    expect(mockedCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type: 'REPLY',
        content_id: 'reply-1',
      })
    );
  });
});
