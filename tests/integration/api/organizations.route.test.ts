/** @jest-environment node */

import { GET, POST } from '@/app/api/organizations/route';
import {
  createOrganization,
  getAllOrganizations,
  getOrganizationsByType,
} from '@/modules/organizations/organizations.service';
import { getCurrentUser } from '@/modules/users/users.service';
import type { IOrganization, IUser } from '@/shared/types/database.types';
import { NextRequest } from 'next/server';

jest.mock('@/modules/organizations/organizations.service', () => ({
  createOrganization: jest.fn(),
  getAllOrganizations: jest.fn(),
  getOrganizationsByType: jest.fn(),
}));

jest.mock('@/modules/users/users.service', () => ({
  getCurrentUser: jest.fn(),
}));

const mockedGetAllOrganizations = jest.mocked(getAllOrganizations);
const mockedGetOrganizationsByType = jest.mocked(getOrganizationsByType);
const mockedCreateOrganization = jest.mocked(createOrganization);
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

const sampleOrgs: IOrganization[] = [
  {
    id: 'org-1',
    name: 'Saint Louis University',
    slug: 'slu',
    type: 'UNIVERSITY',
    parent_id: null,
    created_at: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'org-2',
    name: 'School of Engineering',
    slug: 'soe',
    type: 'SCHOOL',
    parent_id: 'org-1',
    created_at: '2026-03-01T00:00:00.000Z',
  },
];

function buildRequest(url: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ──────────────────────── GET /api/organizations ────────────────────────

describe('GET /api/organizations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all organizations when no type filter is given', async () => {
    mockedGetAllOrganizations.mockResolvedValue(sampleOrgs);

    const response = await GET(buildRequest('http://localhost/api/organizations', 'GET'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: sampleOrgs, error: null });
    expect(mockedGetAllOrganizations).toHaveBeenCalledTimes(1);
    expect(mockedGetOrganizationsByType).not.toHaveBeenCalled();
  });

  it('filters by type when ?type= is specified', async () => {
    const universities = [sampleOrgs[0]];
    mockedGetOrganizationsByType.mockResolvedValue(universities);

    const response = await GET(
      buildRequest('http://localhost/api/organizations?type=UNIVERSITY', 'GET')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: universities, error: null });
    expect(mockedGetOrganizationsByType).toHaveBeenCalledWith('UNIVERSITY');
    expect(mockedGetAllOrganizations).not.toHaveBeenCalled();
  });

  it('filters by SCHOOL type', async () => {
    const schools = [sampleOrgs[1]];
    mockedGetOrganizationsByType.mockResolvedValue(schools);

    const response = await GET(
      buildRequest('http://localhost/api/organizations?type=SCHOOL', 'GET')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: schools, error: null });
    expect(mockedGetOrganizationsByType).toHaveBeenCalledWith('SCHOOL');
  });

  it('filters by DEPARTMENT type', async () => {
    mockedGetOrganizationsByType.mockResolvedValue([]);

    const response = await GET(
      buildRequest('http://localhost/api/organizations?type=DEPARTMENT', 'GET')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [], error: null });
    expect(mockedGetOrganizationsByType).toHaveBeenCalledWith('DEPARTMENT');
  });

  it('returns empty array when no organizations exist', async () => {
    mockedGetAllOrganizations.mockResolvedValue([]);

    const response = await GET(buildRequest('http://localhost/api/organizations', 'GET'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [], error: null });
  });

  it('returns 500 when the service throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetAllOrganizations.mockRejectedValue(new Error('db down'));

    const response = await GET(buildRequest('http://localhost/api/organizations', 'GET'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to fetch organizations', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});

// ──────────────────────── POST /api/organizations ────────────────────────

describe('POST /api/organizations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'STUDENT' });

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Only admins can create organizations', code: 'FORBIDDEN' },
    });
  });

  it('returns 403 for DEPT_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'DEPT_EDITOR' });

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 for UNIVERSITY_EDITOR role', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: 'UNIVERSITY_EDITOR' });

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 when role_name is undefined', async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...adminUser, role_name: undefined });

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 422 when name is missing', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        type: 'DEPARTMENT',
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'name and type are required', code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 422 when type is missing', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Test Org',
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'name and type are required', code: 'VALIDATION_ERROR' },
    });
  });

  it('returns 422 when both name and type are missing', async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);

    const response = await POST(buildRequest('http://localhost/api/organizations', 'POST', {}));

    expect(response.status).toBe(422);
  });

  it('creates an organization for SUPER_ADMIN', async () => {
    const newOrg: IOrganization = {
      id: 'org-new',
      name: 'Computer Science',
      slug: 'computer-science',
      type: 'DEPARTMENT',
      parent_id: 'org-2',
      created_at: '2026-03-10T00:00:00.000Z',
    };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedCreateOrganization.mockResolvedValue(newOrg);

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Computer Science',
        type: 'DEPARTMENT',
        parent_id: 'org-2',
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: newOrg, error: null });
    expect(mockedCreateOrganization).toHaveBeenCalledWith(
      'Computer Science',
      'DEPARTMENT',
      'org-2'
    );
  });

  it('creates an organization without parent_id', async () => {
    const newOrg: IOrganization = {
      id: 'org-root',
      name: 'New University',
      slug: 'new-university',
      type: 'UNIVERSITY',
      parent_id: null,
      created_at: '2026-03-10T00:00:00.000Z',
    };
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedCreateOrganization.mockResolvedValue(newOrg);

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'New University',
        type: 'UNIVERSITY',
      })
    );

    expect(response.status).toBe(201);
    expect(mockedCreateOrganization).toHaveBeenCalledWith(
      'New University',
      'UNIVERSITY',
      undefined
    );
  });

  it('returns 500 when the service throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    mockedCreateOrganization.mockRejectedValue(new Error('insert failed'));

    const response = await POST(
      buildRequest('http://localhost/api/organizations', 'POST', {
        name: 'Broken Org',
        type: 'SCHOOL',
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: { message: 'Failed to create organization', code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});
