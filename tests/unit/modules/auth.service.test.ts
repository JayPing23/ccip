import * as authService from '@/modules/auth/auth.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';
import { asServerSupabaseClient, createSupabaseClientMock } from '../../helpers/supabase';

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
  org_id: 'org-1',
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates institutional domains correctly', () => {
    expect(authService.validateInstitutionalDomain('user@example.edu', 'example.edu')).toBe(true);
    expect(authService.validateInstitutionalDomain('user@gmail.com', 'example.edu')).toBe(false);
  });

  it('treats empty Google tokens as invalid and non-empty tokens as valid', async () => {
    await expect(authService.validateGoogleToken('')).resolves.toBe(false);
    await expect(authService.validateGoogleToken('token-value')).resolves.toBe(true);
  });

  it('rejects OAuth callbacks for non-institutional email addresses', async () => {
    await expect(
      authService.handleGoogleOAuthCallback('user@gmail.com', 'External User', null, 'example.edu')
    ).resolves.toBeNull();

    expect(mockedCreateServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('returns null when there is no authenticated session during OAuth callback', async () => {
    const supabase = createSupabaseClientMock();

    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(
      authService.handleGoogleOAuthCallback(
        'user@example.edu',
        'Campus User',
        'https://example.edu/avatar.png',
        'example.edu'
      )
    ).resolves.toBeNull();
  });

  it('upserts the authenticated user profile during a valid OAuth callback', async () => {
    const supabase = createSupabaseClientMock();
    const syncUserProfile = jest.fn().mockResolvedValue(baseUser);

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const user = await authService.handleGoogleOAuthCallback(
      'user@example.edu',
      'Campus User',
      'https://example.edu/avatar.png',
      'example.edu',
      syncUserProfile
    );

    expect(syncUserProfile).toHaveBeenCalledWith(
      'user-1',
      'user@example.edu',
      'Campus User',
      'https://example.edu/avatar.png'
    );
    expect(user).toEqual(baseUser);
  });

  it('signs out the current session when logging out', async () => {
    const supabase = createSupabaseClientMock();

    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(authService.logoutUser()).resolves.toBeUndefined();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
