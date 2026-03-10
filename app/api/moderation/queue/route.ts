import { getReportQueue, reviewReport } from '@/modules/moderation/moderation.service';
import { REPORT_STATUS, REPORTABLE_CONTENT_TYPE } from '@/modules/moderation/constants';
import type { ReportStatus, ReportableContentType } from '@/modules/moderation/constants';
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

const VALID_STATUSES = new Set(Object.values(REPORT_STATUS));
const VALID_CONTENT_TYPES = new Set(Object.values(REPORTABLE_CONTENT_TYPE));

/**
 * Moderation Queue Endpoints
 * GET   /api/moderation/queue?status=&content_type= — List the report queue (moderators only)
 * PATCH /api/moderation/queue { report_id, status } — Review / update a report's status
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can access the moderation queue');
    }

    const status = request.nextUrl.searchParams.get('status') as ReportStatus | null;
    const contentType = request.nextUrl.searchParams.get(
      'content_type'
    ) as ReportableContentType | null;

    if (status && !VALID_STATUSES.has(status)) {
      return validationError(`status must be one of: ${Object.values(REPORT_STATUS).join(', ')}`);
    }
    if (contentType && !VALID_CONTENT_TYPES.has(contentType)) {
      return validationError(
        `content_type must be one of: ${Object.values(REPORTABLE_CONTENT_TYPE).join(', ')}`
      );
    }

    const reports = await getReportQueue({
      ...(status ? { status } : {}),
      ...(contentType ? { content_type: contentType } : {}),
    });

    return NextResponse.json(successResponse(reports), { status: 200 });
  } catch (error) {
    console.error('[Get Moderation Queue Error]', error);
    return internalError('Failed to fetch moderation queue');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can review reports');
    }

    const body = await request.json();
    const { report_id, status } = body as { report_id?: string; status?: string };

    if (!report_id || !status) {
      return validationError('report_id and status are required');
    }

    if (!VALID_STATUSES.has(status as ReportStatus)) {
      return validationError(`status must be one of: ${Object.values(REPORT_STATUS).join(', ')}`);
    }

    const report = await reviewReport(report_id, user.id, status as ReportStatus);
    return NextResponse.json(successResponse(report), { status: 200 });
  } catch (error) {
    console.error('[Review Report Error]', error);
    return internalError('Failed to review report');
  }
}
