import { getContentById, publishContent } from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canEditAnyContent, canEditOwnContent } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/content/[id]/publish
 * Publish a draft content (transition from DRAFT to PUBLISHED)
 * Requires: User is author or has edit permission (editor/admin)
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Get content to check ownership and current status
    const content = await getContentById(id);
    if (!content) return notFoundError('Content not found');

    // Check permission (own content or admin)
    const isOwner = content.author_id === user.id;
    const canPublish = isOwner
      ? user.role_name
        ? canEditOwnContent(user.role_name)
        : false
      : user.role_name
        ? canEditAnyContent(user.role_name)
        : false;

    if (!canPublish) {
      return forbiddenError('You do not have permission to publish this content');
    }

    // Publish content using service layer
    const published = await publishContent(id, user.id);

    return NextResponse.json(successResponse(published), { status: 200 });
  } catch (error) {
    console.error('[Publish Content Error]', error);
    return internalError('Failed to publish content');
  }
}
