import { ROLES } from '@/shared/constants/roles';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { apiError, forbiddenError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/content/admin
 * Get all content (admin only)
 * Query params:
 *   - status: DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
 *   - visibility: PUBLIC | ORG_ONLY | DEPT_ONLY
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return unauthorizedError();
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return apiError('User not found', 'NOT_FOUND');
    }

    // Get role
    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userData.role_id)
      .single();

    if (!roleData) {
      return apiError('Role not found', 'NOT_FOUND');
    }

    // Only SUPER_ADMIN and UNIVERSITY_EDITOR can see all content
    if (roleData.name !== ROLES.SUPER_ADMIN && roleData.name !== ROLES.UNIVERSITY_EDITOR) {
      return forbiddenError('Only admins can view all content');
    }

    // Build query
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const visibilityParam = url.searchParams.get('visibility');

    let query = supabase
      .from('content')
      .select(
        `
        id,
        title,
        body,
        status,
        visibility,
        slug,
        author_id,
        published_at,
        scheduled_at,
        deleted_at,
        created_at,
        updated_at,
        tags
      `
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusParam && statusParam !== 'ALL') {
      query = query.eq('status', statusParam);
    }

    // Apply visibility filter
    if (visibilityParam && visibilityParam !== 'ALL') {
      query = query.eq('visibility', visibilityParam);
    }

    const { data, error } = await query;

    if (error) {
      return apiError(error.message, 'INTERNAL_SERVER_ERROR');
    }

    return NextResponse.json(
      successResponse({
        data: data || [],
        count: data?.length || 0,
      })
    );
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Unknown error', 'INTERNAL_SERVER_ERROR');
  }
}
