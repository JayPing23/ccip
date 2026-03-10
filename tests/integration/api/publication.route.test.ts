/** @jest-environment node */

import { GET, POST } from '@/app/api/publication/route';
import {
  createArticle,
  getArticleBySlug,
  getManagedArticles,
  getPublishedArticles,
} from '@/modules/publication/publication.service';
import type { IArticle } from '@/modules/publication/types';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/publication/publication.service', () => ({
  createArticle: jest.fn(),
  getArticleBySlug: jest.fn(),
  getManagedArticles: jest.fn(),
  getPublishedArticles: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/shared/utils/rate-limit', () => ({
  articleCreateLimiter: { check: jest.fn().mockReturnValue(null) },
}));

const mockedCreateArticle = jest.mocked(createArticle);
const mockedGetArticleBySlug = jest.mocked(getArticleBySlug);
const mockedGetManagedArticles = jest.mocked(getManagedArticles);
const mockedGetPublishedArticles = jest.mocked(getPublishedArticles);
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

const article: IArticle = {
  id: 'article-1',
  title: 'Student Council Elections',
  body: 'The annual student council elections are scheduled for next month.',
  slug: 'student-council-elections',
  excerpt: 'Elections coming next month.',
  section: 'NEWS',
  status: 'PUBLISHED',
  author_id: 'user-1',
  reviewer_id: 'user-2',
  review_note: null,
  published_at: '2026-03-09T12:00:00.000Z',
  deleted_at: null,
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

describe('publication routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/publication', () => {
    it('lists published articles', async () => {
      mockedGetPublishedArticles.mockResolvedValue([article]);

      const response = await GET(buildRequest('http://localhost/api/publication', 'GET'));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual([article]);
      expect(json.error).toBeNull();
    });

    it('fetches an article by slug', async () => {
      mockedGetArticleBySlug.mockResolvedValue(article);

      const response = await GET(
        buildRequest('http://localhost/api/publication?slug=student-council-elections', 'GET')
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual(article);
    });

    it('returns 404 for missing slug', async () => {
      mockedGetArticleBySlug.mockResolvedValue(null);

      const response = await GET(
        buildRequest('http://localhost/api/publication?slug=nonexistent', 'GET')
      );

      expect(response.status).toBe(404);
    });

    it('returns managed articles for authenticated editors', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);
      mockedGetManagedArticles.mockResolvedValue([article]);

      const response = await GET(
        buildRequest('http://localhost/api/publication?managed=true', 'GET')
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual([article]);
    });

    it('returns 401 for managed view without auth', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const response = await GET(
        buildRequest('http://localhost/api/publication?managed=true', 'GET')
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/publication', () => {
    it('rejects unauthenticated article creation', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const response = await POST(
        buildRequest('http://localhost/api/publication', 'POST', {
          title: 'New Article',
          section: 'NEWS',
        })
      );

      expect(response.status).toBe(401);
    });

    it('rejects students from creating articles', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...editorUser,
        role_name: 'STUDENT',
      });

      const response = await POST(
        buildRequest('http://localhost/api/publication', 'POST', {
          title: 'New Article',
          section: 'NEWS',
        })
      );

      expect(response.status).toBe(403);
    });

    it('returns validation error for malformed payload', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);

      const response = await POST(
        buildRequest('http://localhost/api/publication', 'POST', {
          title: 'Hi',
        })
      );

      expect(response.status).toBe(422);
    });

    it('creates an article from valid payload', async () => {
      mockedGetCurrentUser.mockResolvedValue(editorUser);
      mockedCreateArticle.mockResolvedValue(article);

      const response = await POST(
        buildRequest('http://localhost/api/publication', 'POST', {
          title: 'Student Council Elections',
          body: 'The annual student council elections are scheduled for next month.',
          section: 'NEWS',
        })
      );

      expect(mockedCreateArticle).toHaveBeenCalled();
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data).toEqual(article);
    });
  });
});
