/** @jest-environment node */

import { GET, POST } from '@/app/api/forum/threads/[id]/reply/route';
import { createReply, getRepliesByThread, getThreadById } from '@/modules/forum/forum.service';
import { getActiveRestrictions } from '@/modules/moderation/moderation.service';
import { notifyOnForumReply } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { forumReplyCreateLimiter } from '@/shared/utils/rate-limit';
import type { IForumThread, IForumReply } from '@/modules/forum/types';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/forum/forum.service', () => ({
  createReply: jest.fn(),
  getRepliesByThread: jest.fn(),
  getThreadById: jest.fn(),
}));

jest.mock('@/modules/moderation/moderation.service', () => ({
  getActiveRestrictions: jest.fn(),
}));

jest.mock('@/modules/notifications/notifications.service', () => ({
  notifyOnForumReply: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedCreateReply = jest.mocked(createReply);
const mockedGetRepliesByThread = jest.mocked(getRepliesByThread);
const mockedGetThreadById = jest.mocked(getThreadById);
const mockedGetActiveRestrictions = jest.mocked(getActiveRestrictions);
const mockedNotifyOnForumReply = jest.mocked(notifyOnForumReply);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

const studentUser: IUser = {
  id: 'user-2',
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
  author_id: 'user-1',
  title: 'Help with enrollment',
  body: 'How do I enroll?',
  slug: 'help-with-enrollment',
  status: 'OPEN',
  pinned: false,
  reply_count: 0,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  deleted_at: null,
};

const reply: IForumReply = {
  id: 'reply-1',
  thread_id: 'thread-1',
  author_id: 'user-2',
  body: 'Check the registrar page.',
  status: 'VISIBLE',
  parent_reply_id: null,
  created_at: '2026-03-09T11:00:00.000Z',
  updated_at: '2026-03-09T11:00:00.000Z',
  deleted_at: null,
};

function buildRequest(url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const routeParams = { params: Promise.resolve({ id: 'thread-1' }) };

describe('forum reply routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetActiveRestrictions.mockResolvedValue([]);
    mockedNotifyOnForumReply.mockResolvedValue(undefined);
  });

  // -----------------------------------------------------------------------
  // GET
  // -----------------------------------------------------------------------

  it('lists replies for a thread', async () => {
    mockedGetThreadById.mockResolvedValue(thread);
    mockedGetRepliesByThread.mockResolvedValue([reply]);

    const response = await GET(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'GET'),
      routeParams
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
  });

  it('returns 404 for replies on missing thread', async () => {
    mockedGetThreadById.mockResolvedValue(null);

    const response = await GET(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'GET'),
      routeParams
    );

    expect(response.status).toBe(404);
  });

  // -----------------------------------------------------------------------
  // POST — happy path
  // -----------------------------------------------------------------------

  it('creates a reply for an authenticated user', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(thread);
    mockedCreateReply.mockResolvedValue(reply);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'POST', {
        body: 'Check the registrar page.',
      }),
      routeParams
    );

    expect(response.status).toBe(201);
    expect(mockedNotifyOnForumReply).toHaveBeenCalledWith(
      expect.objectContaining({
        thread_id: 'thread-1',
        thread_author_id: 'user-1',
        reply_author_id: 'user-2',
      })
    );
  });

  // -----------------------------------------------------------------------
  // POST — locked thread
  // -----------------------------------------------------------------------

  it('rejects replies on locked threads', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue({ ...thread, status: 'LOCKED' });

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'POST', {
        body: 'Late reply',
      }),
      routeParams
    );

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.message).toMatch(/locked/i);
  });

  // -----------------------------------------------------------------------
  // POST — rate limiting
  // -----------------------------------------------------------------------

  it('blocks reply creation when rate-limited', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    const spy = jest.spyOn(forumReplyCreateLimiter, 'check');
    spy.mockReturnValueOnce(
      new (await import('next/server')).NextResponse(
        JSON.stringify({ data: null, error: { message: 'Too many requests', code: 'RATE_LIMIT' } }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      )
    );

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'POST', {
        body: 'Testing',
      }),
      routeParams
    );

    expect(response.status).toBe(429);
    spy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // POST — restriction check
  // -----------------------------------------------------------------------

  it('blocks restricted users from replying', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetActiveRestrictions.mockResolvedValue([
      {
        id: 'r-1',
        user_id: 'user-2',
        restriction_type: 'SUSPENDED',
        reason: 'Abuse',
        issued_by: 'mod-1',
        starts_at: '2026-03-09T10:00:00.000Z',
        expires_at: null,
        revoked_at: null,
        created_at: '2026-03-09T10:00:00.000Z',
      },
    ]);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'POST', {
        body: 'Blocked reply',
      }),
      routeParams
    );

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.message).toMatch(/restricted/i);
  });

  // -----------------------------------------------------------------------
  // POST — validation
  // -----------------------------------------------------------------------

  it('rejects a reply without a body', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetThreadById.mockResolvedValue(thread);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads/thread-1/reply', 'POST', {}),
      routeParams
    );

    expect(response.status).toBe(422);
  });
});
