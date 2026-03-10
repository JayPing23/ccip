import {
  createRestriction,
  getActiveRestrictions,
  revokeRestriction,
} from '@/modules/moderation/moderation.service';
import { RESTRICTION_TYPE } from '@/modules/moderation/constants';
import type { RestrictionType } from '@/modules/moderation/constants';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canModerate } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const VALID_RESTRICTION_TYPES = new Set(Object.values(RESTRICTION_TYPE));

/**
 * User Restriction Endpoints
 * GET   /api/moderation/restrictions?user_id= — Get active restrictions for a user
 * POST  /api/moderation/restrictions          — Create a new restriction
 * PATCH /api/moderation/restrictions          — Revoke a restriction
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can view restrictions');
    }

    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) return validationError('user_id query parameter is required');

    const restrictions = await getActiveRestrictions(userId);
    return NextResponse.json(successResponse(restrictions), { status: 200 });
  } catch (error) {
    console.error('[Get Restrictions Error]', error);
    return internalError('Failed to fetch restrictions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can create restrictions');
    }

    const body = await request.json();
    const { user_id, restriction_type, reason, expires_at } = body as {
      user_id?: string;
      restriction_type?: string;
      reason?: string;
      expires_at?: string | null;
    };

    if (!user_id || !restriction_type || !reason) {
      return validationError('user_id, restriction_type, and reason are required');
    }

    if (!VALID_RESTRICTION_TYPES.has(restriction_type as RestrictionType)) {
      return validationError(
        `restriction_type must be one of: ${Object.values(RESTRICTION_TYPE).join(', ')}`
      );
    }

    const restriction = await createRestriction({
      user_id,
      restriction_type: restriction_type as RestrictionType,
      reason,
      issued_by: user.id,
      expires_at: expires_at ?? null,
    });

    return NextResponse.json(successResponse(restriction), { status: 201 });
  } catch (error) {
    console.error('[Create Restriction Error]', error);
    return internalError('Failed to create restriction');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can revoke restrictions');
    }

    const body = await request.json();
    const { restriction_id } = body as { restriction_id?: string };

    if (!restriction_id) {
      return validationError('restriction_id is required');
    }

    const restriction = await revokeRestriction(restriction_id, user.id);
    return NextResponse.json(successResponse(restriction), { status: 200 });
  } catch (error) {
    console.error('[Revoke Restriction Error]', error);
    return internalError('Failed to revoke restriction');
  }
}
