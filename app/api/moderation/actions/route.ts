import {
  createModerationAction,
  getModerationActions,
} from '@/modules/moderation/moderation.service';
import { MODERATION_ACTION_TYPE, REPORTABLE_CONTENT_TYPE } from '@/modules/moderation/constants';
import type { ModerationActionType, ReportableContentType } from '@/modules/moderation/constants';
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

const VALID_ACTIONS = new Set(Object.values(MODERATION_ACTION_TYPE));
const VALID_CONTENT_TYPES = new Set(Object.values(REPORTABLE_CONTENT_TYPE));

/**
 * Moderation Actions Endpoints
 * GET  /api/moderation/actions?content_type=&content_id= — List moderation action history
 * POST /api/moderation/actions { content_type, content_id, action, reason, report_id? }
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can view moderation actions');
    }

    const contentType = request.nextUrl.searchParams.get('content_type') ?? undefined;
    const contentId = request.nextUrl.searchParams.get('content_id') ?? undefined;

    const actions = await getModerationActions(contentType, contentId);
    return NextResponse.json(successResponse(actions), { status: 200 });
  } catch (error) {
    console.error('[Get Moderation Actions Error]', error);
    return internalError('Failed to fetch moderation actions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can take moderation actions');
    }

    const body = await request.json();
    const { content_type, content_id, action, reason, report_id } = body as {
      content_type?: string;
      content_id?: string;
      action?: string;
      reason?: string;
      report_id?: string | null;
    };

    if (!content_type || !content_id || !action || !reason) {
      return validationError('content_type, content_id, action, and reason are required');
    }

    if (!VALID_CONTENT_TYPES.has(content_type as ReportableContentType)) {
      return validationError(
        `content_type must be one of: ${Object.values(REPORTABLE_CONTENT_TYPE).join(', ')}`
      );
    }

    if (!VALID_ACTIONS.has(action as ModerationActionType)) {
      return validationError(
        `action must be one of: ${Object.values(MODERATION_ACTION_TYPE).join(', ')}`
      );
    }

    const result = await createModerationAction({
      moderator_id: user.id,
      report_id: report_id ?? null,
      content_type: content_type as ReportableContentType,
      content_id,
      action: action as ModerationActionType,
      reason,
    });

    return NextResponse.json(successResponse(result), { status: 201 });
  } catch (error) {
    console.error('[Create Moderation Action Error]', error);
    return internalError('Failed to create moderation action');
  }
}
