import { changeUserRole, getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canManageRoles } from '@/shared/utils/permissions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * User Role Assignment Endpoint
 * POST /api/users/[id]/role - Assign role to user (SUPER_ADMIN only)
 */

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorizedError();

    // Only SUPER_ADMIN can assign roles
    if (!currentUser.role_name || !canManageRoles(currentUser.role_name)) {
      return forbiddenError('Only admins can assign roles');
    }

    const body = await request.json();
    const { role_id } = body;

    if (!role_id) {
      return validationError('role_id is required');
    }

    // Update user role
    const updated = await changeUserRole(id, role_id);

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    console.error('[Assign Role Error]', error);
    return internalError('Failed to assign role');
  }
}
