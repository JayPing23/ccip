import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { forbiddenError, internalError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * Admin Stats Endpoint
 * GET /api/admin/stats — Return aggregated counts for the admin dashboard
 * Requires SUPER_ADMIN role
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (user.role_name !== 'SUPER_ADMIN') return forbiddenError('Admin access required');

    const supabase = await createServerSupabaseClient();

    const [usersRes, contentRes, orgsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PUBLISHED')
        .is('deleted_at', null),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json(
      successResponse({
        totalUsers: usersRes.count ?? 0,
        publishedContent: contentRes.count ?? 0,
        totalOrganizations: orgsRes.count ?? 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    return internalError('Failed to fetch admin stats');
  }
}
