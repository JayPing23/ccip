import {
  getOrganizationById,
  getOrganizationHierarchy,
  updateOrganization,
} from '@/modules/organizations/organizations.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canManageOrganizations } from '@/shared/utils/permissions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Organization Detail Endpoints
 * GET /api/organizations/[id] - Get organization with hierarchy
 * PATCH /api/organizations/[id] - Update organization (admin only)
 * DELETE /api/organizations/[id] - Soft delete organization (admin only)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

    if (includeHierarchy) {
      const hierarchy = await getOrganizationHierarchy(id);
      return NextResponse.json(successResponse(hierarchy), { status: 200 });
    } else {
      const org = await getOrganizationById(id);
      if (!org) return notFoundError('Organization not found');
      return NextResponse.json(successResponse(org), { status: 200 });
    }
  } catch (error) {
    console.error('[Get Organization Detail Error]', error);
    return internalError('Failed to fetch organization');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Only SUPER_ADMIN can update organizations
    if (!user.role_name || !canManageOrganizations(user.role_name)) {
      return forbiddenError('Only admins can update organizations');
    }

    const body = await request.json();
    const { name, parent_id } = body;

    if (!name) return validationError('name is required');

    const org = await updateOrganization(id, name, parent_id);

    return NextResponse.json(successResponse(org), { status: 200 });
  } catch (error) {
    console.error('[Update Organization Error]', error);
    return internalError('Failed to update organization');
  }
}

// Note: DELETE is not implemented in Phase 1 to avoid orphaned references
// Will use soft delete pattern in Phase 2
