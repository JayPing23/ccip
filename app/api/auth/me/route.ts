import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * Get Current User
 * GET /api/auth/me
 *
 * Returns the authenticated user's profile
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return unauthorizedError('Not authenticated');
    }

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('User profile not found');
    }

    return NextResponse.json(successResponse(user), {
      status: 200,
    });
  } catch (error) {
    console.error('[Get Current User Error]', error);
    return unauthorizedError('Failed to get current user');
  }
}
