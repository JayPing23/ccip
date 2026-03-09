import { getCurrentUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canManageRoles } from '@/shared/utils/permissions';
import { userProfileSchema } from '@/shared/utils/validation';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Users Endpoints
 * GET /api/users - List all users (admin only)
 * POST /api/users - Create user (admin only)
 */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Only SUPER_ADMIN can list users
    if (!user.role_name || !canManageRoles(user.role_name)) {
      return forbiddenError('Only admins can view all users');
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json(successResponse(data), { status: 200 });
  } catch (error) {
    console.error('[Get Users Error]', error);
    return internalError('Failed to fetch users');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Only SUPER_ADMIN can create users
    if (!user.role_name || !canManageRoles(user.role_name)) {
      return forbiddenError('Only admins can create users');
    }

    const body = await request.json();
    const validated = userProfileSchema.safeParse(body);

    if (!validated.success) {
      return validationError('Invalid user data');
    }

    // Creation is handled through auth signup
    // This endpoint would need more complex auth setup
    return NextResponse.json(
      { data: null, error: { message: 'Use auth signup instead', code: 'NOT_IMPLEMENTED' } },
      { status: 501 }
    );
  } catch (error) {
    console.error('[Create User Error]', error);
    return internalError('Failed to create user');
  }
}
