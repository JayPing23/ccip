import { archiveContent, getContentById } from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canEditAnyContent, canEditOwnContent } from '@/shared/utils/permissions';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/content/[id]/archive
 * Archive a content item (transition to ARCHIVED status)
 * Archived content is hidden but not deleted
 * Requires: User is author or has edit permission (editor/admin)
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Get content to check ownership
    const content = await getContentById(id);
    if (!content) return notFoundError('Content not found');

    // Check permission (own content or admin)
    const isOwner = content.author_id === user.id;
    const canArchive = isOwner
      ? user.role_name
        ? canEditOwnContent(user.role_name)
        : false
      : user.role_name
        ? canEditAnyContent(user.role_name)
        : false;

    if (!canArchive) {
      return forbiddenError('You do not have permission to archive this content');
    }

    // Archive content using service layer
    const archived = await archiveContent(id, user.id);

    return NextResponse.json(successResponse(archived), { status: 200 });
  } catch (error) {
    console.error('[Archive Content Error]', error);
    return internalError('Failed to archive content');
  }
}
