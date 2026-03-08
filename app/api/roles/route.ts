import { getAllRoles } from '@/modules/roles/roles.service';
import { internalError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * Roles Endpoint
 * GET /api/roles - List all available roles
 *
 * No authentication required - roles are public reference data
 */

export async function GET() {
  try {
    const roles = await getAllRoles();
    return NextResponse.json(successResponse(roles), { status: 200 });
  } catch (error) {
    console.error('[Get Roles Error]', error);
    return internalError('Failed to fetch roles');
  }
}
