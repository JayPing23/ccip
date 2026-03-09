import {
  changeUserRole,
  getCurrentUser,
  getUserById,
  updateUserProfile,
} from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canManageRoles } from '@/shared/utils/permissions';
import { userProfileSchema } from '@/shared/utils/validation';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * User Detail Endpoints
 * GET /api/users/[id] - Get user profile
 * PATCH /api/users/[id] - Update own profile or assign role (admin)
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return notFoundError('User not found');
    }

    return NextResponse.json(successResponse(user), { status: 200 });
  } catch (error) {
    console.error('[Get User Detail Error]', error);
    return internalError('Failed to fetch user');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorizedError();

    // Check if updating own profile or assigning role
    const body = await request.json();
    const isRoleChange = 'role_id' in body;

    if (isRoleChange) {
      // Only SUPER_ADMIN can change roles
      if (!currentUser.role_name || !canManageRoles(currentUser.role_name)) {
        return forbiddenError('Only admins can assign roles');
      }

      const { role_id } = body;
      if (!role_id) return validationError('role_id is required');

      const updated = await changeUserRole(id, role_id);
      return NextResponse.json(successResponse(updated), { status: 200 });
    } else {
      // Users can only update their own profile
      if (currentUser.id !== id) {
        return forbiddenError('You can only update your own profile');
      }

      const validated = userProfileSchema.safeParse(body);
      if (!validated.success) {
        return validationError('Invalid user data');
      }

      const updated = await updateUserProfile(
        id,
        validated.data.display_name,
        validated.data.avatar_url
      );

      return NextResponse.json(successResponse(updated), { status: 200 });
    }
  } catch (error) {
    console.error('[Update User Error]', error);
    return internalError('Failed to update user');
  }
}
