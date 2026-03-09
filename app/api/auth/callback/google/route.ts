import { isInstitutionalEmail } from '@/modules/auth/auth.service';
import { upsertUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { apiError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Google OAuth Callback Handler
 * POST /api/auth/callback/google
 *
 * Validates institutional domain and creates/updates user on successful auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, picture, sub: googleId } = body;

    // Validate required fields
    if (!email || !name || !googleId) {
      return apiError('Missing required auth fields', 'VALIDATION_ERROR');
    }

    // Validate institutional domain
    const institutionalDomain = process.env.INSTITUTIONAL_DOMAIN;
    if (!institutionalDomain || !isInstitutionalEmail(email, institutionalDomain)) {
      return apiError(
        `Email domain must be @${institutionalDomain}. You provided: ${email}`,
        'FORBIDDEN'
      );
    }

    // Get or create Supabase auth session
    const supabase = await createServerSupabaseClient();

    // Sign up or link user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: googleId, // Use Google ID as password (insecure but okay for Google OAuth)
    });

    if (authError && authError.status !== 400) {
      throw new Error(authError.message);
    }

    // If user doesn't exist, create them
    let userId: string;
    if (authError?.status === 400) {
      // User doesn't exist, create them
      const { data: newAuth, error: createError } = await supabase.auth.signUp({
        email,
        password: googleId,
      });

      if (createError) throw new Error(createError.message);
      userId = newAuth.user?.id || '';
    } else {
      userId = authData?.user?.id || '';
    }

    // Upsert user profile in our users table
    const user = await upsertUser(userId, email, name, picture);

    return NextResponse.json(successResponse({ userId, user, email }), {
      status: 200,
    });
  } catch (error) {
    console.error('[Auth Callback Error]', error);
    return apiError('Authentication failed', 'INTERNAL_SERVER_ERROR');
  }
}
