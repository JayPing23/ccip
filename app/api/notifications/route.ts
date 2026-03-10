import {
  listNotifications,
  markAllNotificationsAsRead,
} from '@/modules/notifications/notifications.service';
import { NOTIFICATION_DEFAULTS } from '@/modules/notifications/types';
import { getCurrentUser } from '@/modules/users/users.service';
import { internalError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = Math.min(
      Math.max(1, Number(params.get('pageSize')) || NOTIFICATION_DEFAULTS.PAGE_SIZE),
      NOTIFICATION_DEFAULTS.MAX_PAGE_SIZE
    );
    const unreadOnly = params.get('unreadOnly') === 'true';

    const result = await listNotifications({
      userId: user.id,
      page,
      pageSize,
      unreadOnly,
    });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    console.error('[List Notifications Error]', error);
    return internalError('Failed to fetch notifications');
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const count = await markAllNotificationsAsRead(user.id);

    return NextResponse.json(successResponse({ markedCount: count }), { status: 200 });
  } catch (error) {
    console.error('[Mark All Notifications Read Error]', error);
    return internalError('Failed to mark notifications as read');
  }
}
