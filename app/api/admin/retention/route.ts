import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canAccessAdminConsole } from '@/shared/utils/permissions';
import {
  archiveStaleContent,
  getRetentionCandidates,
  getRetentionPolicies,
  updateRetentionPolicy,
  type RetentionContentType,
} from '@/shared/utils/retention';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin Retention Endpoint
 * GET  /api/admin/retention — Return retention policies and candidates
 * PATCH /api/admin/retention — Update a retention policy
 * POST /api/admin/retention — Archive stale content by IDs
 * Requires admin-console access
 */

const VALID_CONTENT_TYPES: RetentionContentType[] = ['ANNOUNCEMENT', 'ARTICLE', 'THREAD'];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canAccessAdminConsole(user.role_name)) {
      return forbiddenError('Admin access required');
    }

    const [policies, candidates] = await Promise.all([
      getRetentionPolicies(),
      getRetentionCandidates(),
    ]);

    return NextResponse.json(successResponse({ policies, candidates }), { status: 200 });
  } catch (error) {
    console.error('[Admin Retention GET Error]', error);
    return internalError('Failed to fetch retention data');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canAccessAdminConsole(user.role_name)) {
      return forbiddenError('Admin access required');
    }

    const body = await request.json();
    const { id, stale_after_days, auto_archive_after_days, enabled } = body;

    if (!id || typeof id !== 'string') {
      return validationError('Policy id is required');
    }

    if (
      stale_after_days !== undefined &&
      (typeof stale_after_days !== 'number' || stale_after_days < 1)
    ) {
      return validationError('stale_after_days must be a positive integer');
    }

    if (
      auto_archive_after_days !== undefined &&
      auto_archive_after_days !== null &&
      (typeof auto_archive_after_days !== 'number' || auto_archive_after_days < 1)
    ) {
      return validationError('auto_archive_after_days must be a positive integer or null');
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return validationError('enabled must be a boolean');
    }

    const updates: Record<string, unknown> = {};
    if (stale_after_days !== undefined) updates.stale_after_days = stale_after_days;
    if (auto_archive_after_days !== undefined)
      updates.auto_archive_after_days = auto_archive_after_days;
    if (enabled !== undefined) updates.enabled = enabled;

    const updated = await updateRetentionPolicy(id, updates);

    if (!updated) {
      return internalError('Failed to update retention policy');
    }

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    console.error('[Admin Retention PATCH Error]', error);
    return internalError('Failed to update retention policy');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canAccessAdminConsole(user.role_name)) {
      return forbiddenError('Admin access required');
    }

    const body = await request.json();
    const { content_type, ids } = body;

    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return validationError('content_type must be ANNOUNCEMENT, ARTICLE, or THREAD');
    }

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id: unknown) => typeof id === 'string')
    ) {
      return validationError('ids must be a non-empty array of strings');
    }

    const archived = await archiveStaleContent(content_type, ids);

    return NextResponse.json(successResponse({ archived }), { status: 200 });
  } catch (error) {
    console.error('[Admin Retention POST Error]', error);
    return internalError('Failed to archive content');
  }
}
