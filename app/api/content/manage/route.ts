import { ANNOUNCEMENT_STATUS, ANNOUNCEMENT_VISIBILITY } from '@/modules/content/constants';
import { getManagedContent } from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import { forbiddenError, internalError, unauthorizedError } from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canAccessContentManager, canViewContentAdministration } from '@/shared/utils/permissions';
import type { IContent } from '@/shared/types/database.types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ANNOUNCEMENT_STATUS_VALUES = new Set<IContent['status']>(Object.values(ANNOUNCEMENT_STATUS));
const ANNOUNCEMENT_VISIBILITY_VALUES = new Set<IContent['visibility']>(
  Object.values(ANNOUNCEMENT_VISIBILITY)
);

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return unauthorizedError();
    }

    if (!currentUser.role_name || !canAccessContentManager(currentUser.role_name)) {
      return forbiddenError('You do not have permission to manage announcements');
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    const visibilityParam = request.nextUrl.searchParams.get('visibility');

    const filters: { status?: IContent['status']; visibility?: IContent['visibility'] } = {};

    if (statusParam && ANNOUNCEMENT_STATUS_VALUES.has(statusParam as IContent['status'])) {
      filters.status = statusParam as IContent['status'];
    }

    if (
      visibilityParam &&
      ANNOUNCEMENT_VISIBILITY_VALUES.has(visibilityParam as IContent['visibility'])
    ) {
      filters.visibility = visibilityParam as IContent['visibility'];
    }

    const announcements = await getManagedContent(
      currentUser.id,
      canViewContentAdministration(currentUser.role_name),
      filters
    );

    return NextResponse.json(successResponse(announcements), { status: 200 });
  } catch (error) {
    console.error('[Managed Content Error]', error);
    return internalError('Failed to load managed announcements');
  }
}
