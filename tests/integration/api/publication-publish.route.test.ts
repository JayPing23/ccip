/** @jest-environment node */

import { POST } from '@/app/api/publication/[id]/publish/route';
import { notifyOnArticlePublish } from '@/modules/notifications/notifications.service';
import {
  getArticleById,
  publishArticle,
  archiveArticle,
} from '@/modules/publication/publication.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IArticle } from '@/modules/publication/types';
import type { IUser } from '@/shared/types/database.types';
import { apiError } from '@/shared/utils/api-errors';
import { articlePublishLimiter } from '@/shared/utils/rate-limit';
import { NextRequest } from 'next/server';

jest.mock('@/modules/publication/publication.service', () => ({
  getArticleById: jest.fn(),
  publishArticle: jest.fn(),
  archiveArticle: jest.fn(),
}));

jest.mock('@/modules/notifications/notifications.service', () => ({
  notifyOnArticlePublish: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/shared/utils/rate-limit', () => ({
  articlePublishLimiter: {
    check: jest.fn(),
  },
}));

const mockedGetArticleById = jest.mocked(getArticleById);
const mockedPublishArticle = jest.mocked(publishArticle);
const mockedArchiveArticle = jest.mocked(archiveArticle);
const mockedNotifyOnArticlePublish = jest.mocked(notifyOnArticlePublish);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedArticlePublishLimiter = jest.mocked(articlePublishLimiter);

const editorUser: IUser = {
  id: 'user-1',
  email: 'editor@example.edu',
  display_name: 'Publication Editor',
  avatar_url: null,
  role_id: 'role-1',
  role_name: 'UNIVERSITY_EDITOR',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

const approvedArticle: IArticle = {
  id: 'article-1',
  title: 'Campus Budget Forum Recap',
  body: 'Students and staff met to discuss the next budget cycle.',
  slug: 'campus-budget-forum-recap',
  excerpt: 'A recap of the latest campus budget forum.',
  section: 'NEWS',
  status: 'APPROVED',
  author_id: 'user-2',
  reviewer_id: 'user-3',
  review_note: null,
  published_at: null,
  deleted_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

function buildRequest(action = 'publish') {
  return new NextRequest('http://localhost/api/publication/article-1/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

describe('publication publish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedArticlePublishLimiter.check.mockReturnValue(null);
    mockedNotifyOnArticlePublish.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated users', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(buildRequest(), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(response.status).toBe(401);
    expect(mockedGetArticleById).not.toHaveBeenCalled();
  });

  it('returns a rate-limit response before loading the article for publish', async () => {
    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedArticlePublishLimiter.check.mockReturnValue(
      apiError('Too many requests. Please try again later.', 'RATE_LIMIT')
    );

    const response = await POST(buildRequest('publish'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT',
      },
    });
    expect(mockedGetArticleById).not.toHaveBeenCalled();
  });

  it('publishes approved articles and triggers notification fan-out', async () => {
    const publishedArticle: IArticle = {
      ...approvedArticle,
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:00:00.000Z',
    };

    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedGetArticleById.mockResolvedValue(approvedArticle);
    mockedPublishArticle.mockResolvedValue(publishedArticle);

    const response = await POST(buildRequest('publish'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(mockedArticlePublishLimiter.check).toHaveBeenCalledWith('user-1');
    expect(mockedGetArticleById).toHaveBeenCalledWith('article-1');
    expect(mockedPublishArticle).toHaveBeenCalledWith('article-1', 'user-1');
    expect(mockedNotifyOnArticlePublish).toHaveBeenCalledWith(publishedArticle);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: publishedArticle, error: null });
  });

  it('does not apply the publish limiter to archive actions', async () => {
    const archivedArticle: IArticle = {
      ...approvedArticle,
      status: 'ARCHIVED',
    };

    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedGetArticleById.mockResolvedValue(approvedArticle);
    mockedArchiveArticle.mockResolvedValue(archivedArticle);

    const response = await POST(buildRequest('archive'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    expect(mockedArticlePublishLimiter.check).not.toHaveBeenCalled();
    expect(mockedArchiveArticle).toHaveBeenCalledWith('article-1', 'user-1');
    expect(response.status).toBe(200);
  });

  it('logs notification failures without failing the publish request', async () => {
    const publishedArticle: IArticle = {
      ...approvedArticle,
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:00:00.000Z',
    };
    const notificationError = new Error('email delivery failed');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetCurrentUser.mockResolvedValue(editorUser);
    mockedGetArticleById.mockResolvedValue(approvedArticle);
    mockedPublishArticle.mockResolvedValue(publishedArticle);
    mockedNotifyOnArticlePublish.mockRejectedValueOnce(notificationError);

    const response = await POST(buildRequest('publish'), {
      params: Promise.resolve({ id: 'article-1' }),
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(response.status).toBe(200);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Publish Article Notify Error]',
      notificationError
    );
  });
});
