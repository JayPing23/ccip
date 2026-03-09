import { isInstitutionalEmail } from '@/modules/auth/auth.service';
import { upsertUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { forbiddenError, internalError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

    if (!isInstitutionalEmail(data.user.email, institutionalDomain)) {
      await supabase.auth.signOut();
      return forbiddenError(`Only @${institutionalDomain} emails allowed`);
    }

    // Create or update user in database
    const displayName = data.user.user_metadata?.full_name || data.user.email.split('@')[0];
    const avatarUrl = data.user.user_metadata?.avatar_url || null;

    const user = await upsertUser(data.user.id, data.user.email, displayName, avatarUrl);

    // Return success with redirect URL
    return NextResponse.json(
      successResponse({
        userId: data.user.id,
        user,
        redirectTo: '/dashboard',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[OAuth Callback Error]', error);
    return internalError('Authentication failed');
  }
}
