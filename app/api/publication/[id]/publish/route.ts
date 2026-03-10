import {
  getArticleById,
  publishArticle,
  archiveArticle,
} from '@/modules/publication/publication.service';
import { notifyOnArticlePublish } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canPublishArticle } from '@/shared/utils/permissions';
import { articlePublishLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/publication/[id]/publish
 * Publish or archive an article.
 *
 * Body:
 *   { action: 'publish' | 'archive' }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canPublishArticle(user.role_name)) {
      return forbiddenError('You do not have permission to publish or archive articles');
    }

    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'publish') {
      const rateLimited = articlePublishLimiter.check(user.id);
      if (rateLimited) return rateLimited;
    }

    const article = await getArticleById(id);
    if (!article) return notFoundError('Article not found');

    if (action === 'publish') {
      const updated = await publishArticle(id, user.id);

      // Fire-and-forget notification fan-out for the published article.
      void notifyOnArticlePublish(updated).catch((err) =>
        console.error('[Publish Article Notify Error]', err)
      );

      return NextResponse.json(successResponse(updated), { status: 200 });
    }

    if (action === 'archive') {
      const updated = await archiveArticle(id, user.id);
      return NextResponse.json(successResponse(updated), { status: 200 });
    }

    return validationError('Invalid action. Expected "publish" or "archive"');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish article';
    if (message.includes('Only approved articles') || message.includes('already archived')) {
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 422 }
      );
    }
    console.error('[Publish Article Error]', error);
    return internalError('Failed to publish/archive article');
  }
}
