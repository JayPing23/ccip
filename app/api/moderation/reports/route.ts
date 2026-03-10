import { getReportById } from '@/modules/moderation/moderation.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canModerate } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Moderation Reports Endpoint
 * GET /api/moderation/reports?id= — Get a single report by ID (moderators only)
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canModerate(user.role_name)) {
      return forbiddenError('Only moderators can view reports');
    }

    const reportId = request.nextUrl.searchParams.get('id');
    if (!reportId) return validationError('id query parameter is required');

    const report = await getReportById(reportId);
    if (!report) return notFoundError('Report not found');

    return NextResponse.json(successResponse(report), { status: 200 });
  } catch (error) {
    console.error('[Get Moderation Report Error]', error);
    return internalError('Failed to fetch report');
  }
}
