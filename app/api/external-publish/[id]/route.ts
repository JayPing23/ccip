import {
  cancelExternalPublishTarget,
  getExternalPublishTargetById,
  getExternalPublishTargets,
  markTargetFailed,
  markTargetPosted,
} from '@/modules/external_publish/external_publish.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canCrossPost } from '@/shared/utils/permissions';
import { NextResponse, type NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * External Publish Target Endpoint
 * GET   /api/external-publish/[id] — Get targets for a content item or a single target
 * PATCH /api/external-publish/[id] — Update a target (mark posted, failed, or cancel)
 */

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canCrossPost(user.role_name)) {
      return forbiddenError('Cross-post permission required');
    }

    const { id } = await context.params;

    // Check if this is a content_id lookup or a target_id lookup
    const { searchParams } = request.nextUrl;
    const byContent = searchParams.get('by') === 'content';

    if (byContent) {
      const targets = await getExternalPublishTargets(id);
      return NextResponse.json(successResponse(targets), { status: 200 });
    }

    const target = await getExternalPublishTargetById(id);
    if (!target) return notFoundError('External publish target not found');

    return NextResponse.json(successResponse(target), { status: 200 });
  } catch (error) {
    console.error('[External Publish [id] GET Error]', error);
    return internalError('Failed to fetch external publish target');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canCrossPost(user.role_name)) {
      return forbiddenError('Cross-post permission required');
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['mark_posted', 'mark_failed', 'cancel'].includes(action)) {
      return validationError('action must be mark_posted, mark_failed, or cancel');
    }

    let result;

    switch (action) {
      case 'mark_posted': {
        const { external_post_id } = body;
        if (!external_post_id || typeof external_post_id !== 'string') {
          return validationError('external_post_id is required for mark_posted');
        }
        result = await markTargetPosted(id, external_post_id);
        break;
      }
      case 'mark_failed': {
        const { error_message } = body;
        if (!error_message || typeof error_message !== 'string') {
          return validationError('error_message is required for mark_failed');
        }
        result = await markTargetFailed(id, error_message);
        break;
      }
      case 'cancel': {
        result = await cancelExternalPublishTarget(id);
        break;
      }
    }

    if (!result) return notFoundError('External publish target not found or not updatable');

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    console.error('[External Publish [id] PATCH Error]', error);
    return internalError('Failed to update external publish target');
  }
}
