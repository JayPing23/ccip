import { createServiceRoleClient } from '@/shared/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/auth/signup
 * Handles email/password user registration
 *
 * Body:
 * {
 *   email: string (must be @slu.edu.ph)
 *   password: string (min 8 chars)
 *   confirmPassword: string
 *   displayName: string
 * }
 *
 * Returns:
 * {
 *   success: boolean
 *   userId?: string
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, displayName } = body;

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate institutional domain
    const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';
    const [, domain] = email.split('@');

    if (domain !== institutionalDomain) {
      return NextResponse.json(
        {
          success: false,
          error: `Only @${institutionalDomain} email addresses are allowed`,
        },
        { status: 400 }
      );
    }

    // Get service role client (can create users)
    const supabaseAdmin = createServiceRoleClient();

    // Create auth user with email/password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for institutional domain
      user_metadata: {
        display_name: displayName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth user creation failed:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create user record in app_public.users table
    const studentRoleResult = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'STUDENT')
      .single();

    if (studentRoleResult.error || !studentRoleResult.data) {
      console.error('Failed to fetch STUDENT role');
      return NextResponse.json(
        { success: false, error: 'Failed to complete user setup' },
        { status: 500 }
      );
    }

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      role_id: studentRoleResult.data.id,
      avatar_url: null,
      org_id: null,
    });

    if (userError) {
      console.error('User record creation failed:', userError);
      // Clean up: delete auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Failed to complete user setup' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: authData.user.id,
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
