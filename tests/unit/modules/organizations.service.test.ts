import * as organizationsService from '@/modules/organizations/organizations.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IOrganization } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

const universityOrg: IOrganization = {
  id: 'org-1',
  name: 'Example University',
  slug: 'example-university',
  type: 'UNIVERSITY',
  parent_id: null,
  created_at: '2026-03-09T10:00:00.000Z',
};

const departmentOrg: IOrganization = {
  id: 'org-2',
  name: 'Computer Science',
  slug: 'computer-science',
  type: 'DEPARTMENT',
  parent_id: 'org-1',
  created_at: '2026-03-09T10:05:00.000Z',
};

describe('organizations.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all organizations ordered by name', async () => {
    const supabase = createSupabaseClientMock();
    const orgsBuilder = createQueryBuilder<IOrganization[]>({
      data: [departmentOrg, universityOrg],
      error: null,
    });

    supabase.from.mockReturnValueOnce(orgsBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getAllOrganizations()).resolves.toEqual([
      departmentOrg,
      universityOrg,
    ]);
    expect(orgsBuilder.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('returns an organization by slug when it exists', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization>({ data: departmentOrg, error: null });

    supabase.from.mockReturnValueOnce(orgBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationBySlug('computer-science')).resolves.toEqual(
      departmentOrg
    );
  });

  it('returns null when an organization slug lookup misses', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(orgBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationBySlug('missing-org')).resolves.toBeNull();
  });

  it('builds an organization hierarchy with parent and children', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization>({ data: departmentOrg, error: null });
    const parentBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });
    const childrenBuilder = createQueryBuilder<IOrganization[]>({
      data: [
        {
          id: 'org-3',
          name: 'Software Engineering',
          slug: 'software-engineering',
          type: 'DEPARTMENT',
          parent_id: 'org-2',
          created_at: '2026-03-09T10:10:00.000Z',
        },
      ],
      error: null,
    });

    supabase.from
      .mockReturnValueOnce(orgBuilder)
      .mockReturnValueOnce(parentBuilder)
      .mockReturnValueOnce(childrenBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const hierarchy = await organizationsService.getOrganizationHierarchy('org-2');

    expect(hierarchy).toEqual({
      org: departmentOrg,
      parent: universityOrg,
      children: [
        {
          id: 'org-3',
          name: 'Software Engineering',
          slug: 'software-engineering',
          type: 'DEPARTMENT',
          parent_id: 'org-2',
          created_at: '2026-03-09T10:10:00.000Z',
        },
      ],
    });
  });

  it('returns a hierarchy with no parent for top-level organizations', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });
    const childrenBuilder = createQueryBuilder<IOrganization[]>({ data: [], error: null });

    supabase.from.mockReturnValueOnce(orgBuilder).mockReturnValueOnce(childrenBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationHierarchy('org-1')).resolves.toEqual({
      org: universityOrg,
      parent: null,
      children: [],
    });
  });

  it('throws when building a hierarchy for a missing organization', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(orgBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationHierarchy('missing')).rejects.toThrow(
      'Organization not found'
    );
  });

  it('throws when child organization lookup fails during hierarchy fetch', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization>({ data: departmentOrg, error: null });
    const parentBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });
    const childrenBuilder = createQueryBuilder<IOrganization[] | null>({
      data: null,
      error: { message: 'children unavailable' },
    });

    supabase.from
      .mockReturnValueOnce(orgBuilder)
      .mockReturnValueOnce(parentBuilder)
      .mockReturnValueOnce(childrenBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationHierarchy('org-2')).rejects.toThrow(
      'children unavailable'
    );
  });

  it('returns organizations filtered by type', async () => {
    const supabase = createSupabaseClientMock();
    const orgsBuilder = createQueryBuilder<IOrganization[]>({
      data: [departmentOrg],
      error: null,
    });

    supabase.from.mockReturnValueOnce(orgsBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationsByType('DEPARTMENT')).resolves.toEqual([
      departmentOrg,
    ]);
    expect(orgsBuilder.eq).toHaveBeenCalledWith('type', 'DEPARTMENT');
  });

  it('creates a new organization with a generated slug', async () => {
    const supabase = createSupabaseClientMock();
    const insertBuilder = createQueryBuilder<IOrganization>({
      data: departmentOrg,
      error: null,
    });

    supabase.from.mockReturnValueOnce(insertBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const org = await organizationsService.createOrganization(
      'Computer Science',
      'DEPARTMENT',
      'org-1'
    );

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      name: 'Computer Science',
      slug: 'computer-science',
      type: 'DEPARTMENT',
      parent_id: 'org-1',
    });
    expect(org).toEqual(departmentOrg);
  });

  it('creates a top-level organization with a null parent id', async () => {
    const supabase = createSupabaseClientMock();
    const insertBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });

    supabase.from.mockReturnValueOnce(insertBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(
      organizationsService.createOrganization('Example University', 'UNIVERSITY')
    ).resolves.toEqual(universityOrg);
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      name: 'Example University',
      slug: 'example-university',
      type: 'UNIVERSITY',
      parent_id: null,
    });
  });

  it('updates an organization and regenerates its slug', async () => {
    const supabase = createSupabaseClientMock();
    const updateBuilder = createQueryBuilder<IOrganization>({
      data: {
        ...departmentOrg,
        name: 'Computer Science and AI',
        slug: 'computer-science-and-ai',
      },
      error: null,
    });

    supabase.from.mockReturnValueOnce(updateBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const org = await organizationsService.updateOrganization(
      'org-2',
      'Computer Science and AI',
      'org-1'
    );

    expect(updateBuilder.update).toHaveBeenCalledWith({
      name: 'Computer Science and AI',
      slug: 'computer-science-and-ai',
      parent_id: 'org-1',
    });
    expect(org.slug).toBe('computer-science-and-ai');
  });

  it('leaves parent_id undefined when updating without a new parent', async () => {
    const supabase = createSupabaseClientMock();
    const updateBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });

    supabase.from.mockReturnValueOnce(updateBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(
      organizationsService.updateOrganization('org-1', 'Example University')
    ).resolves.toEqual(universityOrg);
    expect(updateBuilder.update).toHaveBeenCalledWith({
      name: 'Example University',
      slug: 'example-university',
      parent_id: undefined,
    });
  });

  it('delegates getOrganizationTree to the hierarchy lookup', async () => {
    const supabase = createSupabaseClientMock();
    const orgBuilder = createQueryBuilder<IOrganization>({ data: departmentOrg, error: null });
    const parentBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });
    const childrenBuilder = createQueryBuilder<IOrganization[]>({ data: [], error: null });

    supabase.from
      .mockReturnValueOnce(orgBuilder)
      .mockReturnValueOnce(parentBuilder)
      .mockReturnValueOnce(childrenBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getOrganizationTree('org-2')).resolves.toEqual({
      org: departmentOrg,
      parent: universityOrg,
      children: [],
    });
  });

  it('returns an empty array when the user has no primary organization', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<{ org_id: string | null }>({
      data: { org_id: null },
      error: null,
    });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getUserOrganizations('user-1')).resolves.toEqual([]);
  });

  it('returns an empty array when the user lookup fails', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<{ org_id: string | null } | null>({
      data: null,
      error: { message: 'user missing' },
    });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getUserOrganizations('user-404')).resolves.toEqual([]);
  });

  it('returns the user primary organization when it exists', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<{ org_id: string | null }>({
      data: { org_id: 'org-1' },
      error: null,
    });
    const orgBuilder = createQueryBuilder<IOrganization>({ data: universityOrg, error: null });

    supabase.from.mockReturnValueOnce(userBuilder).mockReturnValueOnce(orgBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getUserOrganizations('user-1')).resolves.toEqual([
      universityOrg,
    ]);
  });

  it('returns an empty array when the primary organization no longer exists', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<{ org_id: string | null }>({
      data: { org_id: 'org-404' },
      error: null,
    });
    const orgBuilder = createQueryBuilder<IOrganization | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(userBuilder).mockReturnValueOnce(orgBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.getUserOrganizations('user-1')).resolves.toEqual([]);
  });

  it('issues a soft-delete style update for organizations', async () => {
    const supabase = createSupabaseClientMock();
    const deleteBuilder = createQueryBuilder<IOrganization>({ data: departmentOrg, error: null });

    supabase.from.mockReturnValueOnce(deleteBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(organizationsService.deleteOrganization('org-2')).resolves.toEqual(departmentOrg);
    expect(deleteBuilder.update).toHaveBeenCalledWith({});
  });
});
