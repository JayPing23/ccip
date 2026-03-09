import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Handles email/password user login
 *
 * Body:
 * {
 *   email: string
 *   password: string
 * }
 *
 * Returns:
 * {
 *   success: boolean
 *   session?: { user: { ... }, access_token: string, ... }
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('Login failed:', error);
      return NextResponse.json(
        { success: false, error: error?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Validate institutional domain
    const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';

    if (!data.session.user.email?.endsWith(`@${institutionalDomain}`)) {
      // Sign out if wrong domain
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: `Only @${institutionalDomain} email addresses are allowed` },
        { status: 401 }
      );
    }

    // Create response with session
    const response = NextResponse.json(
      {
        success: true,
        session: data.session,
      },
      { status: 200 }
    );

    // Supabase SSR client automatically handles cookies, so no need to manually set them

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
