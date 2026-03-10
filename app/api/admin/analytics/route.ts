import { getAnalyticsReport } from '@/modules/admin/analytics.service';
import type { AnalyticsQueryParams } from '@/modules/admin/types/analytics.types';
import { getCurrentUser } from '@/modules/users/users.service';
import { forbiddenError, internalError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canAccessAdminConsole } from '@/shared/utils/permissions';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin Analytics Endpoint
 * GET /api/admin/analytics — Return analytics overview and trends
 * Query params: startDate, endDate, granularity
 * Requires admin-console access
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();
    if (!user.role_name || !canAccessAdminConsole(user.role_name)) {
      return forbiddenError('Admin access required');
    }

    const { searchParams } = request.nextUrl;
    const params: AnalyticsQueryParams = {};

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity');

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (granularity === 'day' || granularity === 'week' || granularity === 'month') {
      params.granularity = granularity;
    }

    const report = await getAnalyticsReport(params);

    return NextResponse.json(successResponse(report), { status: 200 });
  } catch (error) {
    console.error('[Admin Analytics Error]', error);
    return internalError('Failed to fetch analytics');
  }
}
