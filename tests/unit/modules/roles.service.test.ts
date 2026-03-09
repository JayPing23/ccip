import * as rolesService from '@/modules/roles/roles.service';
import { ROLES } from '@/shared/constants/roles';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IRole } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

describe('roles.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when listing roles fails', async () => {
    const supabase = createSupabaseClientMock();
    const rolesBuilder = createQueryBuilder<IRole[] | null>({
      data: null,
      error: { message: 'roles unavailable' },
    });

    supabase.from.mockReturnValueOnce(rolesBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getAllRoles()).rejects.toThrow('roles unavailable');
  });

  it('returns all roles from the database', async () => {
    const supabase = createSupabaseClientMock();
    const roles: IRole[] = [
      { id: '1', name: 'DEPT_EDITOR', created_at: '2026-03-09T10:00:00.000Z' },
      { id: '2', name: 'SUPER_ADMIN', created_at: '2026-03-09T10:00:00.000Z' },
    ];
    const rolesBuilder = createQueryBuilder<IRole[]>({ data: roles, error: null });

    supabase.from.mockReturnValueOnce(rolesBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getAllRoles()).resolves.toEqual(roles);
    expect(rolesBuilder.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('returns a role by id when it exists', async () => {
    const supabase = createSupabaseClientMock();
    const role: IRole = {
      id: 'role-1',
      name: 'SUPER_ADMIN',
      created_at: '2026-03-09T10:00:00.000Z',
    };
    const roleBuilder = createQueryBuilder<IRole>({ data: role, error: null });

    supabase.from.mockReturnValueOnce(roleBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getRoleById('role-1')).resolves.toEqual(role);
  });

  it('returns null when a role id lookup fails', async () => {
    const supabase = createSupabaseClientMock();
    const roleBuilder = createQueryBuilder<IRole | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(roleBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getRoleById('missing-role')).resolves.toBeNull();
  });

  it('returns a role by name when it exists', async () => {
    const supabase = createSupabaseClientMock();
    const role: IRole = {
      id: 'role-2',
      name: 'DEPT_EDITOR',
      created_at: '2026-03-09T10:00:00.000Z',
    };
    const roleBuilder = createQueryBuilder<IRole>({ data: role, error: null });

    supabase.from.mockReturnValueOnce(roleBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getRoleByName('DEPT_EDITOR')).resolves.toEqual(role);
  });

  it('returns null when a named role does not exist', async () => {
    const supabase = createSupabaseClientMock();
    const roleBuilder = createQueryBuilder<IRole | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(roleBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(rolesService.getRoleByName('STUDENT')).resolves.toBeNull();
  });

  it.each([
    [ROLES.STUDENT, 'create_content', false],
    [ROLES.UNIVERSITY_EDITOR, 'createContent', true],
    [ROLES.DEPT_EDITOR, 'create_content', true],
    [ROLES.DEPT_EDITOR, 'edit_own_content', true],
    [ROLES.UNIVERSITY_EDITOR, 'editOwnContent', true],
    [ROLES.STUDENT, 'edit_any_content', false],
    [ROLES.SUPER_ADMIN, 'editAnyContent', true],
    [ROLES.DEPT_EDITOR, 'delete_own_content', true],
    [ROLES.UNIVERSITY_EDITOR, 'deleteOwnContent', true],
    [ROLES.STUDENT, 'delete_any_content', false],
    [ROLES.SUPER_ADMIN, 'deleteAnyContent', true],
    [ROLES.SUPER_ADMIN, 'manage_roles', true],
    [ROLES.SUPER_ADMIN, 'manageRoles', true],
    [ROLES.SUPER_ADMIN, 'manage_organizations', true],
    [ROLES.SUPER_ADMIN, 'manageOrganizations', true],
    [ROLES.SUPER_ADMIN, 'view_audit_logs', true],
    [ROLES.UNIVERSITY_EDITOR, 'cross_post', true],
    [ROLES.SUPER_ADMIN, 'crossPost', true],
    [ROLES.DEPT_EDITOR, 'cross_post', false],
    [ROLES.DEPT_EDITOR, 'upload_media', true],
    [ROLES.UNIVERSITY_EDITOR, 'uploadMedia', true],
    [ROLES.DEPT_EDITOR, 'schedule_posts', true],
    [ROLES.SUPER_ADMIN, 'schedulePosts', true],
    [ROLES.SUPER_ADMIN, 'viewAuditLogs', true],
    [ROLES.STUDENT, 'unknown_permission', false],
  ] as const)('maps %s to %s => %s', (role, permission, allowed) => {
    expect(rolesService.checkUserPermission(role, permission)).toBe(allowed);
  });
});
