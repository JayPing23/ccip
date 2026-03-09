import { createClient } from '@/shared/lib/supabase';
import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase-server';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({ kind: 'browser-client' })),
  createServerClient: jest.fn(() => ({ kind: 'server-client' })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ kind: 'service-role-client' })),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockedCreateBrowserClient = jest.mocked(createBrowserClient);
const mockedCreateServerClient = jest.mocked(createServerClient);
const mockedCreateSupabaseClient = jest.mocked(createSupabaseClient);
const mockedCookies = jest.mocked(cookies);

describe('supabase client wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('creates the browser client with the public environment variables', () => {
    const client = createClient();

    expect(mockedCreateBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    );
    expect(client).toEqual({ kind: 'browser-client' });
  });

  it('creates the service-role client with the server-only key', () => {
    const client = createServiceRoleClient();

    expect(mockedCreateSupabaseClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key'
    );
    expect(client).toEqual({ kind: 'service-role-client' });
  });

  it('creates the server client with cookie adapters', async () => {
    const cookieStore = {
      getAll: jest.fn().mockReturnValue([{ name: 'sb', value: 'token' }]),
      set: jest.fn(),
    };

    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    const client = await createServerSupabaseClient();

    expect(client).toEqual({ kind: 'server-client' });
    expect(mockedCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );

    const cookieAdapter = mockedCreateServerClient.mock.calls[0]?.[2]?.cookies;
    expect(cookieAdapter).toBeDefined();

    if (!cookieAdapter?.getAll || !cookieAdapter.setAll) {
      throw new Error('Cookie adapter was not passed to createServerClient');
    }

    expect(cookieAdapter.getAll()).toEqual([{ name: 'sb', value: 'token' }]);
    cookieAdapter.setAll([
      { name: 'sb-refresh', value: 'refresh-token', options: { httpOnly: true } },
    ]);
    expect(cookieStore.set).toHaveBeenCalledWith('sb-refresh', 'refresh-token', {
      httpOnly: true,
    });
  });
});
