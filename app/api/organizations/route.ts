import {
  createOrganization,
  getAllOrganizations,
  getOrganizationsByType,
} from '@/modules/organizations/organizations.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canManageOrganizations } from '@/shared/utils/permissions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Organizations Endpoints
 * GET /api/organizations - List all organizations
 * POST /api/organizations - Create organization (admin only)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT' | null;

    let orgs;
    if (type) {
      orgs = await getOrganizationsByType(type);
    } else {
      orgs = await getAllOrganizations();
    }

    return NextResponse.json(successResponse(orgs), { status: 200 });
  } catch (error) {
    console.error('[Get Organizations Error]', error);
    return internalError('Failed to fetch organizations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Only SUPER_ADMIN can create organizations
    if (!user.role_name || !canManageOrganizations(user.role_name)) {
      return forbiddenError('Only admins can create organizations');
    }

    const body = await request.json();
    const { name, type, parent_id } = body;

    if (!name || !type) {
      return validationError('name and type are required');
    }

    const org = await createOrganization(name, type, parent_id);

    return NextResponse.json(successResponse(org), { status: 201 });
  } catch (error) {
    console.error('[Create Organization Error]', error);
    return internalError('Failed to create organization');
  }
}
