import { createReport } from '@/modules/moderation/moderation.service';
import { REPORT_REASON, REPORTABLE_CONTENT_TYPE } from '@/modules/moderation/constants';
import type { ReportReason } from '@/modules/moderation/constants';
import { getThreadById } from '@/modules/forum/forum.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { forumReportCreateLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const VALID_REASONS = new Set(Object.values(REPORT_REASON));

/**
 * Forum Thread Report Endpoint
 * POST /api/forum/threads/[id]/report — Report a thread (or a reply within it)
 */

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const limitError = forumReportCreateLimiter.check(user.id);
    if (limitError) return limitError;

    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    const body = await request.json();
    const { reason, description, reply_id } = body as {
      reason?: string;
      description?: string;
      reply_id?: string;
    };

    if (!reason || !VALID_REASONS.has(reason as ReportReason)) {
      return validationError(`reason must be one of: ${Object.values(REPORT_REASON).join(', ')}`);
    }

    const contentType = reply_id ? REPORTABLE_CONTENT_TYPE.REPLY : REPORTABLE_CONTENT_TYPE.THREAD;
    const contentId = reply_id ?? id;

    const report = await createReport({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason: reason as ReportReason,
      description: description ?? null,
    });

    return NextResponse.json(successResponse(report), { status: 201 });
  } catch (error) {
    console.error('[Create Report Error]', error);
    return internalError('Failed to submit report');
  }
}
