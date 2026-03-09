/** @jest-environment node */

import { DELETE, GET, PATCH } from '@/app/api/content/[id]/route';
import { deleteContent, getContentById, updateContent } from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IContent, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/content/content.service', () => ({
  deleteContent: jest.fn(),
  getContentById: jest.fn(),
  updateContent: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedDeleteContent = jest.mocked(deleteContent);
const mockedGetContentById = jest.mocked(getContentById);
const mockedUpdateContent = jest.mocked(updateContent);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

const baseContent: IContent = {
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

const ownerUser: IUser = {
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

function buildRequest(method: 'GET' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/content/content-1', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('content detail routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a single content item', async () => {
    mockedGetContentById.mockResolvedValue(baseContent);

    const response = await GET(buildRequest('GET'), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: baseContent, error: null });
  });

  it('allows owners to update their own content', async () => {
    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedGetContentById.mockResolvedValue(baseContent);
    mockedUpdateContent.mockResolvedValue({
      ...baseContent,
      title: 'Updated Campus Advisory',
    });

    const response = await PATCH(
      buildRequest('PATCH', {
        title: 'Updated Campus Advisory',
        body: 'Classes are suspended and offices close at noon.',
        visibility: 'PUBLIC',
      }),
      { params: Promise.resolve({ id: 'content-1' }) }
    );

    expect(mockedUpdateContent).toHaveBeenCalledWith(
      'content-1',
      {
        title: 'Updated Campus Advisory',
        body: 'Classes are suspended and offices close at noon.',
        visibility: 'PUBLIC',
      },
      'user-1'
    );
    expect(response.status).toBe(200);
  });

  it('prevents non-admin users from editing content they do not own', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...ownerUser,
      id: 'user-2',
    });
    mockedGetContentById.mockResolvedValue(baseContent);

    const response = await PATCH(
      buildRequest('PATCH', {
        title: 'Blocked Update',
        body: 'This should be rejected by permissions.',
        visibility: 'PUBLIC',
      }),
      { params: Promise.resolve({ id: 'content-1' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'You do not have permission to edit this content',
        code: 'FORBIDDEN',
      },
    });
  });

  it('allows super admins to delete content they do not own', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...ownerUser,
      id: 'admin-1',
      role_name: 'SUPER_ADMIN',
    });
    mockedGetContentById.mockResolvedValue(baseContent);
    mockedDeleteContent.mockResolvedValue({
      ...baseContent,
      deleted_at: '2026-03-09T11:00:00.000Z',
    });

    const response = await DELETE(buildRequest('DELETE'), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(mockedDeleteContent).toHaveBeenCalledWith('content-1', 'admin-1');
    expect(response.status).toBe(200);
  });
});
