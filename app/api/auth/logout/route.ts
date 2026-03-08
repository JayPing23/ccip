import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { apiError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * Sign Out Handler
 * POST /api/auth/logout
 *
 * Clears the user's session
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw new Error(error.message);

    return NextResponse.json(successResponse({ message: 'Signed out successfully' }), {
      status: 200,
    });
  } catch (error) {
    console.error('[Logout Error]', error);
    return apiError('Failed to sign out', 'INTERNAL_SERVER_ERROR');
  }
}
