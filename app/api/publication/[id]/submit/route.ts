import { getArticleById, submitArticleForReview } from '@/modules/publication/publication.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canEditOwnArticle, canEditAnyArticle } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/publication/[id]/submit
 * Submit an article for editorial review (DRAFT → IN_REVIEW).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const article = await getArticleById(id);
    if (!article) return notFoundError('Article not found');

    const isOwner = article.author_id === user.id;
    const canSubmit = isOwner
      ? user.role_name
        ? canEditOwnArticle(user.role_name)
        : false
      : user.role_name
        ? canEditAnyArticle(user.role_name)
        : false;

    if (!canSubmit) {
      return forbiddenError('You do not have permission to submit this article');
    }

    const updated = await submitArticleForReview(id, user.id);
    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit article';
    if (message.includes('Only draft articles')) {
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 422 }
      );
    }
    console.error('[Submit Article Error]', error);
    return internalError('Failed to submit article for review');
  }
}
