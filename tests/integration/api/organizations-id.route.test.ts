/** @jest-environment node */

import { GET, PATCH } from '@/app/api/organizations/[id]/route';
import {
  getOrganizationById,
  getOrganizationHierarchy,
  updateOrganization,
} from '@/modules/organizations/organizations.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IOrganization, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/organizations/organizations.service', () => ({
  getOrganizationById: jest.fn(),
  getOrganizationHierarchy: jest.fn(),
  updateOrganization: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetOrganizationById = jest.mocked(getOrganizationById);
const mockedGetOrganizationHierarchy = jest.mocked(getOrganizationHierarchy);
const mockedUpdateOrganization = jest.mocked(updateOrganization);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);

const adminUser: IUser = {
  id: 'admin-1',
  email: 'admin@slu.edu.ph',
  display_name: 'Super Admin',
  avatar_url: null,
  role_id: 'role-admin',
  role_name: 'SUPER_ADMIN',
  org_id: 'org-university',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
};

const sampleOrg: IOrganization = {
  id: 'org-1',
  name: 'Saint Louis University',
  slug: 'slu',
  type: 'UNIVERSITY',
  parent_id: null,
  created_at: '2026-03-01T00:00:00.000Z',
};

function buildRequest(url: string, method: 'GET' | 'PATCH', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ──────────────────────── GET /api/organizations/[id] ────────────────────────

describe('GET /api/organizations/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns organization by id', async () => {
    mockedGetOrganizationById.mockResolvedValue(sampleOrg);

    const response = await GET(buildRequest('http://localhost/api/organizations/org-1', 'GET'), {
      params: Promise.resolve({ id: 'org-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: sampleOrg, error: null });
    expect(mockedGetOrganizationById).toHaveBeenCalledWith('org-1');
  });

  it('returns 404 for non-existent organization', async () => {
    mockedGetOrganizationById.mockResolvedValue(null);

    const response = await GET(
      buildRequest('http://localhost/api/organizations/missing-id', 'GET'),
      { params: Promise.resolve({ id: 'missing-id' }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Organization not found', code: 'NOT_FOUND' },
    });
  });

  it('returns hierarchy when ?hierarchy=true', async () => {
    const hierarchy = {
      org: sampleOrg,
      parent: null,
      children: [
        {
          id: 'org-2',
          name: 'School of Engineering',
          slug: 'soe',
          type: 'SCHOOL' as const,
          parent_id: 'org-1',
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
    };
    mockedGetOrganizationHierarchy.mockResolvedValue(hierarchy);

    const response = await GET(
      buildRequest('http://localhost/api/organizations/org-1?hierarchy=true', 'GET'),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: hierarchy, error: null });
    expect(mockedGetOrganizationHierarchy).toHaveBeenCalledWith('org-1');
    expect(mockedGetOrganizationById).not.toHaveBeenCalled();
  });

  it('does not use hierarchy when ?hierarchy=false', async () => {
    mockedGetOrganizationById.mockResolvedValue(sampleOrg);

    const response = await GET(
      buildRequest('http://localhost/api/organizations/org-1?hierarchy=false', 'GET'),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(200);
    expect(mockedGetOrganizationById).toHaveBeenCalledWith('org-1');
    expect(mockedGetOrganizationHierarchy).not.toHaveBeenCalled();
  });

  it('returns 500 when the service throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetOrganizationById.mockRejectedValue(new Error('db error'));

    const response = await GET(buildRequest('http://localhost/api/organizations/org-1', 'GET'), {
      params: Promise.resolve({ id: 'org-1' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to fetch organization', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

// ──────────────────────── PATCH /api/organizations/[id] ────────────────────────

describe('PATCH /api/organizations/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Updated' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'STUDENT' });

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Updated' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Only admins can update organizations', code: 'FORBIDDEN' },
    });
  });

  it('returns 403 for DEPT_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'DEPT_EDITOR' });

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Updated' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 for UNIVERSITY_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'UNIVERSITY_EDITOR' });

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Updated' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 when role_name is undefined', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: undefined });

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Updated' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(403);
  });

  it('returns 422 when name is missing', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { parent_id: 'org-2' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'name is required', code: 'VALIDATION_ERROR' },
    });
  });

  it('updates organization for SUPER_ADMIN', async () => {
    const updated = { ...sampleOrg, name: 'SLU Updated' };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedUpdateOrganization.mockResolvedValue(updated);

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', {
        name: 'SLU Updated',
        parent_id: null,
      }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: updated, error: null });
    expect(mockedUpdateOrganization).toHaveBeenCalledWith('org-1', 'SLU Updated', null);
  });

  it('passes parent_id through when provided', async () => {
    const updated = { ...sampleOrg, name: 'Moved Org', parent_id: 'org-parent' };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedUpdateOrganization.mockResolvedValue(updated);

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', {
        name: 'Moved Org',
        parent_id: 'org-parent',
      }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateOrganization).toHaveBeenCalledWith('org-1', 'Moved Org', 'org-parent');
  });

  it('returns 500 when the service throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedUpdateOrganization.mockRejectedValue(new Error('update failed'));

    const response = await PATCH(
      buildRequest('http://localhost/api/organizations/org-1', 'PATCH', { name: 'Fail' }),
      { params: Promise.resolve({ id: 'org-1' }) }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to update organization', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});
