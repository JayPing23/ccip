import { markNotificationAsRead } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { internalError, notFoundError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const { id } = await params;

    const notification = await markNotificationAsRead(id, user.id);

    return NextResponse.json(successResponse(notification), { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('PGRST116')) {
      return notFoundError('Notification not found');
    }
    console.error('[Mark Notification Read Error]', error);
    return internalError('Failed to mark notification as read');
  }
}
