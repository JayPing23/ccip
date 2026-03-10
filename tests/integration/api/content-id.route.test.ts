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

  // ───────────────── GET /api/content/[id] ─────────────────

  describe('GET', () => {
    it('returns a single content item', async () => {
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await GET(buildRequest('GET'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ data: baseContent, error: null });
    });

    it('returns 404 for non-existent content', async () => {
      mockedGetContentById.mockResolvedValue(null);

      const response = await GET(buildRequest('GET'), {
        params: Promise.resolve({ id: 'missing-id' }),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        data: null,
        error: { message: 'Content not found', code: 'NOT_FOUND' },
      });
    });

    it('returns 500 when the service throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetContentById.mockRejectedValue(new Error('db error'));

      const response = await GET(buildRequest('GET'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        data: null,
        error: { message: 'Failed to fetch content', code: 'INTERNAL_SERVER_ERROR' },
      });
    });
  });

  // ───────────────── PATCH /api/content/[id] ─────────────────

  describe('PATCH', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const response = await PATCH(
        buildRequest('PATCH', { title: 'Updated', body: 'Updated body', visibility: 'PUBLIC' }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(401);
    });

    it('returns 404 when content does not exist', async () => {
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(null);

      const response = await PATCH(
        buildRequest('PATCH', { title: 'Updated', body: 'Updated body', visibility: 'PUBLIC' }),
        { params: Promise.resolve({ id: 'missing-id' }) }
      );

      expect(response.status).toBe(404);
    });

    it('allows DEPT_EDITOR owner to update their own content', async () => {
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

    it('allows UNIVERSITY_EDITOR owner to update their own content', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        role_name: 'UNIVERSITY_EDITOR',
      });
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedUpdateContent.mockResolvedValue({ ...baseContent, title: 'UE Updated' });

      const response = await PATCH(
        buildRequest('PATCH', {
          title: 'UE Updated',
          body: 'New body content here.',
          visibility: 'PUBLIC',
        }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(200);
    });

    it('allows SUPER_ADMIN to update content they do not own', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        id: 'admin-1',
        role_name: 'SUPER_ADMIN',
      });
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedUpdateContent.mockResolvedValue({ ...baseContent, title: 'Admin Updated' });

      const response = await PATCH(
        buildRequest('PATCH', {
          title: 'Admin Updated',
          body: 'Admin body.',
          visibility: 'PUBLIC',
        }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(200);
      expect(mockedUpdateContent).toHaveBeenCalledWith(
        'content-1',
        { title: 'Admin Updated', body: 'Admin body.', visibility: 'PUBLIC' },
        'admin-1'
      );
    });

    it('prevents non-owner DEPT_EDITOR from editing', async () => {
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

    it('prevents STUDENT from editing any content', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        id: 'user-1',
        role_name: 'STUDENT',
      });
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await PATCH(
        buildRequest('PATCH', { title: 'Student Edit', body: 'No access.', visibility: 'PUBLIC' }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(403);
    });

    it('prevents user with undefined role_name from editing', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        role_name: undefined,
      });
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await PATCH(
        buildRequest('PATCH', { title: 'No Role', body: 'No access.', visibility: 'PUBLIC' }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(403);
    });

    it('validates the request body', async () => {
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await PATCH(
        buildRequest('PATCH', { title: 'Hi', visibility: 'INVALID_VIS' }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        data: null,
        error: { message: 'Invalid content data', code: 'VALIDATION_ERROR' },
      });
    });

    it('allows partial updates (title only)', async () => {
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedUpdateContent.mockResolvedValue({ ...baseContent, title: 'Only Title' });

      const response = await PATCH(buildRequest('PATCH', { title: 'Only Title' }), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(200);
      expect(mockedUpdateContent).toHaveBeenCalledWith(
        'content-1',
        { title: 'Only Title' },
        'user-1'
      );
    });

    it('returns 500 when updateContent throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedUpdateContent.mockRejectedValue(new Error('update failed'));

      const response = await PATCH(
        buildRequest('PATCH', { title: 'Fail Update', body: 'Will fail.', visibility: 'PUBLIC' }),
        { params: Promise.resolve({ id: 'content-1' }) }
      );

      expect(response.status).toBe(500);
    });
  });

  // ───────────────── DELETE /api/content/[id] ─────────────────

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedGetCurrentUser.mockResolvedValue(null);

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(401);
    });

    it('returns 404 when content does not exist', async () => {
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(null);

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'missing-id' }),
      });

      expect(response.status).toBe(404);
    });

    it('allows content owner (DEPT_EDITOR) to delete their own content', async () => {
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedDeleteContent.mockResolvedValue({
        ...baseContent,
        deleted_at: '2026-03-09T11:00:00.000Z',
      });

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(mockedDeleteContent).toHaveBeenCalledWith('content-1', 'user-1');
      expect(response.status).toBe(200);
    });

    it('allows UNIVERSITY_EDITOR owner to delete their own content', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        role_name: 'UNIVERSITY_EDITOR',
      });
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedDeleteContent.mockResolvedValue({
        ...baseContent,
        deleted_at: '2026-03-09T11:00:00.000Z',
      });

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(200);
    });

    it('allows SUPER_ADMIN to delete content they do not own', async () => {
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

    it('prevents non-owner DEPT_EDITOR from deleting', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        id: 'user-2',
      });
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        data: null,
        error: {
          message: 'You do not have permission to delete this content',
          code: 'FORBIDDEN',
        },
      });
    });

    it('prevents STUDENT from deleting any content', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        id: 'user-1',
        role_name: 'STUDENT',
      });
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(403);
    });

    it('prevents user with undefined role_name from deleting', async () => {
      mockedGetCurrentUser.mockResolvedValue({
        ...ownerUser,
        role_name: undefined,
      });
      mockedGetContentById.mockResolvedValue(baseContent);

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(403);
    });

    it('returns 500 when deleteContent throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedGetCurrentUser.mockResolvedValue(ownerUser);
      mockedGetContentById.mockResolvedValue(baseContent);
      mockedDeleteContent.mockRejectedValue(new Error('delete failed'));

      const response = await DELETE(buildRequest('DELETE'), {
        params: Promise.resolve({ id: 'content-1' }),
      });

      expect(response.status).toBe(500);
    });
  });
});
