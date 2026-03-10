/** @jest-environment node */

import { GET, POST } from '@/app/api/content/route';
import {
  createContent,
  getContentBySlug,
  getPublishedContent,
} from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IContent, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/content/content.service', () => ({
  createContent: jest.fn(),
  getContentBySlug: jest.fn(),
  getPublishedContent: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedCreateContent = jest.mocked(createContent);
const mockedGetContentBySlug = jest.mocked(getContentBySlug);
const mockedGetPublishedContent = jest.mocked(getPublishedContent);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

const editorUser: IUser = {
  id: 'user-1',
  email: 'editor@example.edu',
  display_name: 'Editor',
  avatar_url: null,
  role_id: 'role-1',
  role_name: 'DEPT_EDITOR',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const content: IContent = {
  id: 'content-1',
  title: 'Campus Advisory',
  body: 'Classes are suspended in the afternoon due to weather.',
  slug: 'campus-advisory',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  author_id: 'user-1',
  tags: ['emergency'],
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  published_at: '2026-03-09T10:00:00.000Z',
  scheduled_at: null,
  deleted_at: null,
};

function buildRequest(url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('content routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists published content', async () => {
    mockedGetPublishedContent.mockResolvedValue([content]);

    const response = await GET(buildRequest('http://localhost/api/content', 'GET'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [content], error: null });
  });

  it('returns a 404 when fetching a missing slug', async () => {
    mockedGetContentBySlug.mockResolvedValue(null);

    const response = await GET(buildRequest('http://localhost/api/content?slug=missing', 'GET'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Content not found' },
    });
  });

  it('rejects unauthenticated content creation', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/content', 'POST', {
        title: 'Campus Advisory',
        description: 'Classes are suspended in the afternoon due to weather.',
        visibility: 'PUBLIC',
      })
    );

    expect(response.status).toBe(401);
  });

  it('rejects users without content-creation permission', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...editorUser,
      role_name: 'STUDENT',
    });

    const response = await POST(
      buildRequest('http://localhost/api/content', 'POST', {
        title: 'Campus Advisory',
        description: 'Classes are suspended in the afternoon due to weather.',
        visibility: 'PUBLIC',
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'You do not have permission to create content',
        code: 'FORBIDDEN',
      },
    });
  });

  it('returns validation errors for malformed payloads', async () => {
    mockedGetCurrentUser.mockResolvedValue(editorUser);

    const response = await POST(
      buildRequest('http://localhost/api/content', 'POST', {
        title: 'Hi',
        visibility: 'PUBLIC',
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Invalid content data', code: 'VALIDATION_ERROR' },
    });
  });

  it('creates content from a valid form payload', async () => {
    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedCreateContent.mockResolvedValue(content);

    const response = await POST(
      buildRequest('http://localhost/api/content', 'POST', {
        title: 'Campus Advisory',
        description: 'Classes are suspended in the afternoon due to weather.',
        visibility: 'PUBLIC',
      })
    );

    expect(mockedCreateContent).toHaveBeenCalledWith(
      'Campus Advisory',
      'Classes are suspended in the afternoon due to weather.',
      'DRAFT',
      'PUBLIC',
      [],
      'user-1',
      undefined,
      undefined
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: content, error: null });
  });

  it('passes tags through when creating content', async () => {
    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedCreateContent.mockResolvedValue(content);

    const response = await POST(
      buildRequest('http://localhost/api/content', 'POST', {
        title: 'Campus Advisory',
        description: 'Classes are suspended in the afternoon due to weather.',
        visibility: 'PUBLIC',
        tags: ['emergency'],
      })
    );

    expect(mockedCreateContent).toHaveBeenCalledWith(
      'Campus Advisory',
      'Classes are suspended in the afternoon due to weather.',
      'DRAFT',
      'PUBLIC',
      [],
      'user-1',
      undefined,
      ['emergency']
    );
    expect(response.status).toBe(201);
  });
});
