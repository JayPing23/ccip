/** @jest-environment node */

import { POST } from '@/app/api/content/[id]/publish/route';
import { getContentById, publishContent } from '@/modules/content/content.service';
import { notifyOnPublish } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IContent, IUser } from '@/shared/types/database.types';
import { apiError } from '@/shared/utils/api-errors';
import { contentPublishLimiter } from '@/shared/utils/rate-limit';
import { NextRequest } from 'next/server';

jest.mock('@/modules/content/content.service', () => ({
  getContentById: jest.fn(),
  publishContent: jest.fn(),
}));

jest.mock('@/modules/notifications/notifications.service', () => ({
  notifyOnPublish: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/shared/utils/rate-limit', () => ({
  contentPublishLimiter: {
    check: jest.fn(),
  },
}));

const mockedGetContentById = jest.mocked(getContentById);
const mockedPublishContent = jest.mocked(publishContent);
const mockedNotifyOnPublish = jest.mocked(notifyOnPublish);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedContentPublishLimiter = jest.mocked(contentPublishLimiter);

const draftContent: IContent = {
  id: 'content-1',
  title: 'Campus Advisory',
  body: 'Classes are suspended in the afternoon due to weather.',
  slug: 'campus-advisory',
  status: 'DRAFT',
  visibility: 'PUBLIC',
  author_id: 'user-1',
  tags: ['emergency'],
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  published_at: null,
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

function buildRequest() {
  return new NextRequest('http://localhost/api/content/content-1/publish', {
    method: 'POST',
  });
}

describe('content publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContentPublishLimiter.check.mockReturnValue(null);
    mockedNotifyOnPublish.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated users', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(401);
    expect(mockedGetContentById).not.toHaveBeenCalled();
  });

  it('returns a rate-limit response before loading content', async () => {
    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedContentPublishLimiter.check.mockReturnValue(
      apiError('Too many requests. Please try again later.', 'RATE_LIMIT')
    );

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT',
      },
    });
    expect(mockedGetContentById).not.toHaveBeenCalled();
  });

  it('returns 404 when the content does not exist', async () => {
    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedGetContentById.mockResolvedValue(null);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'Content not found',
        code: 'NOT_FOUND',
      },
    });
  });

  it('prevents non-admin users from publishing content they do not own', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...ownerUser,
      id: 'user-2',
    });
    mockedGetContentById.mockResolvedValue(draftContent);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'You do not have permission to publish this content',
        code: 'FORBIDDEN',
      },
    });
    expect(mockedPublishContent).not.toHaveBeenCalled();
  });

  it('allows owners to publish content and trigger notifications', async () => {
    const publishedContent: IContent = {
      ...draftContent,
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:00:00.000Z',
    };

    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedGetContentById.mockResolvedValue(draftContent);
    mockedPublishContent.mockResolvedValue(publishedContent);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(mockedContentPublishLimiter.check).toHaveBeenCalledWith('user-1');
    expect(mockedGetContentById).toHaveBeenCalledWith('content-1');
    expect(mockedPublishContent).toHaveBeenCalledWith('content-1', 'user-1');
    expect(mockedNotifyOnPublish).toHaveBeenCalledWith(publishedContent);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: publishedContent, error: null });
  });

  it('allows super admins to publish content they do not own', async () => {
    const publishedContent: IContent = {
      ...draftContent,
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:00:00.000Z',
    };

    mockedGetCurrentUser.mockResolvedValue({
      ...ownerUser,
      id: 'admin-1',
      role_name: 'SUPER_ADMIN',
    });
    mockedGetContentById.mockResolvedValue(draftContent);
    mockedPublishContent.mockResolvedValue(publishedContent);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(mockedPublishContent).toHaveBeenCalledWith('content-1', 'admin-1');
    expect(response.status).toBe(200);
  });

  it('logs notification failures without failing the publish request', async () => {
    const publishedContent: IContent = {
      ...draftContent,
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:00:00.000Z',
    };
    const notificationError = new Error('email delivery failed');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedGetContentById.mockResolvedValue(draftContent);
    mockedPublishContent.mockResolvedValue(publishedContent);
    mockedNotifyOnPublish.mockRejectedValueOnce(notificationError);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(response.status).toBe(200);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Publish Notify Error]', notificationError);
  });

  it('returns 500 when publishing throws an unexpected error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetCurrentUser.mockResolvedValue(ownerUser);
    mockedGetContentById.mockResolvedValue(draftContent);
    mockedPublishContent.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'content-1' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'Failed to publish content',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
