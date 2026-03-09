import * as usersService from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

const baseUser: IUser = {
  id: 'user-1',
  email: 'user@example.edu',
  display_name: 'Test User',
  avatar_url: 'https://example.edu/avatar.png',
  role_id: 'role-1',
  role_name: 'SUPER_ADMIN',
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('users.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('returns null when there is no authenticated user', async () => {
    const supabase = createSupabaseClientMock();
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getCurrentUser()).resolves.toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns the current user profile with a flattened role name', async () => {
    const supabase = createSupabaseClientMock();
    const joinedUser = {
      ...baseUser,
      role: { name: 'SUPER_ADMIN' as const },
    };
    const userBuilder = createQueryBuilder<typeof joinedUser>({
      data: joinedUser,
      error: null,
    });

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.getCurrentUser();

    expect(user).toEqual({
      ...baseUser,
      role_name: 'SUPER_ADMIN',
    });
  });

  it('returns null when the authenticated profile lookup fails', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<IUser | null>({
      data: null,
      error: { message: 'profile missing', code: 'PGRST116' },
    });

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getCurrentUser()).resolves.toBeNull();
  });

  it('returns a user by id when found', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<IUser>({ data: baseUser, error: null });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getUserById('user-1')).resolves.toEqual(baseUser);
  });

  it('returns null when a user id lookup fails', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<IUser | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getUserById('missing-user')).resolves.toBeNull();
  });

  it('returns a user by email when found', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<IUser>({ data: baseUser, error: null });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getUserByEmail('user@example.edu')).resolves.toEqual(baseUser);
  });

  it('returns null when an email lookup fails', async () => {
    const supabase = createSupabaseClientMock();
    const userBuilder = createQueryBuilder<IUser | null>({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    supabase.from.mockReturnValueOnce(userBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(usersService.getUserByEmail('missing@example.edu')).resolves.toBeNull();
  });

  it('looks up the default student role before upserting a user when no role is provided', async () => {
    const supabase = createSupabaseClientMock();
    const roleBuilder = createQueryBuilder<{ id: string } | null>({
      data: { id: 'role-student' },
      error: null,
    });
    const upsertBuilder = createQueryBuilder<IUser>({
      data: { ...baseUser, role_id: 'role-student', role_name: undefined },
      error: null,
    });

    supabase.from.mockReturnValueOnce(roleBuilder).mockReturnValueOnce(upsertBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.upsertUser(
      'user-1',
      'user@example.edu',
      'Test User',
      'https://example.edu/avatar.png'
    );

    expect(roleBuilder.eq).toHaveBeenCalledWith('name', 'STUDENT');
    expect(upsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        email: 'user@example.edu',
        display_name: 'Test User',
        role_id: 'role-student',
      }),
      { onConflict: 'id' }
    );
    expect(user.role_id).toBe('role-student');
  });

  it('uses the provided role id without querying for the default student role', async () => {
    const supabase = createSupabaseClientMock();
    const upsertBuilder = createQueryBuilder<IUser>({
      data: { ...baseUser, role_id: 'role-editor' },
      error: null,
    });

    supabase.from.mockReturnValueOnce(upsertBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.upsertUser(
      'user-1',
      'user@example.edu',
      'Test User',
      null,
      'role-editor'
    );

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(upsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 'role-editor',
        avatar_url: null,
      }),
      { onConflict: 'id' }
    );
    expect(user.role_id).toBe('role-editor');
  });

  it('updates a user profile and stamps updated_at', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T13:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const updateBuilder = createQueryBuilder<IUser>({
      data: {
        ...baseUser,
        display_name: 'Updated User',
        avatar_url: null,
        updated_at: '2026-03-09T13:00:00.000Z',
      },
      error: null,
    });

    supabase.from.mockReturnValueOnce(updateBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.updateUserProfile('user-1', 'Updated User', null);

    expect(updateBuilder.update).toHaveBeenCalledWith({
      display_name: 'Updated User',
      avatar_url: null,
      updated_at: '2026-03-09T13:00:00.000Z',
    });
    expect(user.display_name).toBe('Updated User');
  });

  it('changes a user organization', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T13:30:00.000Z'));

    const supabase = createSupabaseClientMock();
    const orgChangeBuilder = createQueryBuilder<IUser>({
      data: {
        ...baseUser,
        org_id: 'org-2',
        updated_at: '2026-03-09T13:30:00.000Z',
      },
      error: null,
    });

    supabase.from.mockReturnValueOnce(orgChangeBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.changeUserOrganization('user-1', 'org-2');

    expect(orgChangeBuilder.update).toHaveBeenCalledWith({
      org_id: 'org-2',
      updated_at: '2026-03-09T13:30:00.000Z',
    });
    expect(user.org_id).toBe('org-2');
  });

  it('changes a user role and stamps updated_at', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T14:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const roleChangeBuilder = createQueryBuilder<IUser>({
      data: {
        ...baseUser,
        role_id: 'role-2',
        updated_at: '2026-03-09T14:00:00.000Z',
      },
      error: null,
    });

    supabase.from.mockReturnValueOnce(roleChangeBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await usersService.changeUserRole('user-1', 'role-2');

    expect(roleChangeBuilder.update).toHaveBeenCalledWith({
      role_id: 'role-2',
      updated_at: '2026-03-09T14:00:00.000Z',
    });
    expect(user.role_id).toBe('role-2');
  });
});
