import { deleteContent, getContentById, updateContent } from '@/modules/content/content.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import {
  canDeleteAnyContent,
  canDeleteOwnContent,
  canEditAnyContent,
  canEditOwnContent,
} from '@/shared/utils/permissions';
import { contentSchema } from '@/shared/utils/validation';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Content Detail Endpoints
 * GET /api/content/[id] - Get single content
 * PATCH /api/content/[id] - Update content (requires permission)
 * DELETE /api/content/[id] - Soft delete content (requires permission)
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const content = await getContentById(id);

    if (!content) {
      return notFoundError('Content not found');
    }

    return NextResponse.json(successResponse(content), { status: 200 });
  } catch (error) {
    console.error('[Get Content Detail Error]', error);
    return internalError('Failed to fetch content');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Get content to check ownership
    const content = await getContentById(id);
    if (!content) return notFoundError('Content not found');

    // Check permission (own content or admin)
    const isOwner = content.author_id === user.id;
    const canEdit = isOwner
      ? user.role_name
        ? canEditOwnContent(user.role_name)
        : false
      : user.role_name
        ? canEditAnyContent(user.role_name)
        : false;

    if (!canEdit) {
      return forbiddenError('You do not have permission to edit this content');
    }

    // Parse and validate
    const body = await request.json();
    const validated = contentSchema.partial().safeParse(body);

    if (!validated.success) {
      return validationError('Invalid content data');
    }

    // Update content
    const updated = await updateContent(id, validated.data as any, user.id);

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    console.error('[Update Content Error]', error);
    return internalError('Failed to update content');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    // Get content to check ownership
    const content = await getContentById(id);
    if (!content) return notFoundError('Content not found');

    // Check permission (own content or admin)
    const isOwner = content.author_id === user.id;
    const canDelete = isOwner
      ? user.role_name
        ? canDeleteOwnContent(user.role_name)
        : false
      : user.role_name
        ? canDeleteAnyContent(user.role_name)
        : false;

    if (!canDelete) {
      return forbiddenError('You do not have permission to delete this content');
    }

    // Delete content
    const deleted = await deleteContent(id, user.id);

    return NextResponse.json(successResponse(deleted), { status: 200 });
  } catch (error) {
    console.error('[Delete Content Error]', error);
    return internalError('Failed to delete content');
  }
}
