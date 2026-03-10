import {
  getArticleById,
  approveArticle,
  requestArticleRevision,
} from '@/modules/publication/publication.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canReviewArticle } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/publication/[id]/review
 * Approve or request revision on an article (IN_REVIEW → APPROVED | DRAFT).
 *
 * Body:
 *   { action: 'approve' | 'request_revision', review_note?: string }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canReviewArticle(user.role_name)) {
      return forbiddenError('You do not have permission to review articles');
    }

    const article = await getArticleById(id);
    if (!article) return notFoundError('Article not found');

    const body = await request.json();
    const { action, review_note } = body as {
      action?: string;
      review_note?: string;
    };

    if (action === 'approve') {
      const updated = await approveArticle(id, user.id, review_note);
      return NextResponse.json(successResponse(updated), { status: 200 });
    }

    if (action === 'request_revision') {
      if (!review_note || review_note.trim().length === 0) {
        return validationError('A review note is required when requesting revision');
      }
      const updated = await requestArticleRevision(id, user.id, review_note);
      return NextResponse.json(successResponse(updated), { status: 200 });
    }

    return validationError('Invalid action. Expected "approve" or "request_revision"');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review article';
    if (message.includes('Only articles in review')) {
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 422 }
      );
    }
    console.error('[Review Article Error]', error);
    return internalError('Failed to review article');
  }
}
