import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth/callback
 *
 * Handles OAuth callback from Supabase.
 * This endpoint:
 * 1. Exchanges the auth code for a session
 * 2. Validates institutional email domain
 * 3. Creates user in database if needed
 * 4. Responds with session info for client to process
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      return NextResponse.json(
        { error: error?.message || 'Failed to get user from OAuth' },
        { status: 401 }
      );
    }

    // Validate institutional domain
    const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';
    const emailDomain = data.user.email.split('@')[1];

    if (emailDomain !== institutionalDomain) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: `Only @${institutionalDomain} emails allowed` },
        { status: 403 }
      );
    }

    // Create or update user in database
    const serverClient = supabase;

    const { data: existingUser, error: selectError } = await serverClient
      .from('users')
      .select('id')
      .eq('auth_id', data.user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Create user if new
    if (!existingUser) {
      const { error: insertError } = await serverClient.from('users').insert([
        {
          auth_id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || '',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          institutional_domain: institutionalDomain,
        },
      ]);

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Return success with redirect URL
    return NextResponse.json({ success: true, redirectTo: '/dashboard' }, { status: 200 });
  } catch (error) {
    console.error('[OAuth Callback Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
