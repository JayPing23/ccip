import { getUnreadCount } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { internalError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const summary = await getUnreadCount(user.id);

    return NextResponse.json(successResponse(summary), { status: 200 });
  } catch (error) {
    console.error('[Unread Count Error]', error);
    return internalError('Failed to fetch unread count');
  }
}
