/** @jest-environment node */

import { GET, POST } from '@/app/api/forum/threads/route';
import { createThread, getThreadsByCategory, getThreadBySlug } from '@/modules/forum/forum.service';
import { getActiveRestrictions } from '@/modules/moderation/moderation.service';
import { notifyOnForumThread } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { forumThreadCreateLimiter } from '@/shared/utils/rate-limit';
import type { IForumThread } from '@/modules/forum/types';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/forum/forum.service', () => ({
  createThread: jest.fn(),
  getThreadsByCategory: jest.fn(),
  getThreadBySlug: jest.fn(),
}));

jest.mock('@/modules/moderation/moderation.service', () => ({
  getActiveRestrictions: jest.fn(),
}));

jest.mock('@/modules/notifications/notifications.service', () => ({
  notifyOnForumThread: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedCreateThread = jest.mocked(createThread);
const mockedGetThreadsByCategory = jest.mocked(getThreadsByCategory);
const mockedGetThreadBySlug = jest.mocked(getThreadBySlug);
const mockedGetActiveRestrictions = jest.mocked(getActiveRestrictions);
const mockedNotifyOnForumThread = jest.mocked(notifyOnForumThread);
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
  author_id: 'user-1',
  title: 'Help with enrollment',
  body: 'How do I enroll in summer classes?',
  slug: 'help-with-enrollment',
  status: 'OPEN',
  pinned: false,
  reply_count: 0,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  deleted_at: null,
};

function buildRequest(url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('forum threads routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetActiveRestrictions.mockResolvedValue([]);
    mockedNotifyOnForumThread.mockResolvedValue(undefined);
  });

  // -----------------------------------------------------------------------
  // GET
  // -----------------------------------------------------------------------

  it('fetches a thread by slug', async () => {
    mockedGetThreadBySlug.mockResolvedValue(thread);

    const response = await GET(
      buildRequest('http://localhost/api/forum/threads?slug=help-with-enrollment', 'GET')
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual(thread);
  });

  it('returns 404 for unknown slug', async () => {
    mockedGetThreadBySlug.mockResolvedValue(null);

    const response = await GET(
      buildRequest('http://localhost/api/forum/threads?slug=missing', 'GET')
    );

    expect(response.status).toBe(404);
  });

  it('lists threads by category', async () => {
    mockedGetThreadsByCategory.mockResolvedValue({ threads: [thread], total: 1 });

    const response = await GET(
      buildRequest('http://localhost/api/forum/threads?category_id=cat-1', 'GET')
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.threads).toHaveLength(1);
  });

  it('returns validation error without category_id', async () => {
    const response = await GET(buildRequest('http://localhost/api/forum/threads', 'GET'));

    expect(response.status).toBe(422);
  });

  // -----------------------------------------------------------------------
  // POST — authentication and authorization
  // -----------------------------------------------------------------------

  it('rejects unauthenticated thread creation', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads', 'POST', {
        category_id: 'cat-1',
        title: 'Test',
        body: 'Test body',
      })
    );

    expect(response.status).toBe(401);
  });

  it('creates a thread for an authenticated user', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedCreateThread.mockResolvedValue(thread);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads', 'POST', {
        category_id: 'cat-1',
        title: 'Help with enrollment',
        body: 'How do I enroll in summer classes?',
      })
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data.id).toBe('thread-1');
    expect(mockedNotifyOnForumThread).toHaveBeenCalled();
  });

  it('returns validation error for missing fields', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads', 'POST', {
        title: 'Missing body',
      })
    );

    expect(response.status).toBe(422);
  });

  // -----------------------------------------------------------------------
  // POST — rate limiting
  // -----------------------------------------------------------------------

  it('blocks thread creation when rate-limited', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);

    // Exhaust the limiter
    const spy = jest.spyOn(forumThreadCreateLimiter, 'check');
    spy.mockReturnValueOnce(
      new (await import('next/server')).NextResponse(
        JSON.stringify({ data: null, error: { message: 'Too many requests', code: 'RATE_LIMIT' } }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      )
    );

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads', 'POST', {
        category_id: 'cat-1',
        title: 'Rate limited',
        body: 'Test',
      })
    );

    expect(response.status).toBe(429);
    spy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // POST — restriction check
  // -----------------------------------------------------------------------

  it('blocks restricted users from creating threads', async () => {
    mockedGetCurrentUser.mockResolvedValue(studentUser);
    mockedGetActiveRestrictions.mockResolvedValue([
      {
        id: 'r-1',
        user_id: 'user-1',
        restriction_type: 'MUTED',
        reason: 'Spam',
        issued_by: 'mod-1',
        starts_at: '2026-03-09T10:00:00.000Z',
        expires_at: null,
        revoked_at: null,
        created_at: '2026-03-09T10:00:00.000Z',
      },
    ]);

    const response = await POST(
      buildRequest('http://localhost/api/forum/threads', 'POST', {
        category_id: 'cat-1',
        title: 'Blocked',
        body: 'Test',
      })
    );

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.message).toMatch(/restricted/i);
  });
});
