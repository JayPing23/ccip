import type { ArticleSection, ArticleStatus } from '@/modules/publication/constants';
import type { CreateArticleInput } from '@/modules/publication/publication.service';
import {
  createArticle,
  getPublishedArticles,
  getArticleBySlug,
  getManagedArticles,
} from '@/modules/publication/publication.service';
import { articleCreateSchema } from '@/modules/publication/schemas/article.schema';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canCreateArticle, canEditAnyArticle } from '@/shared/utils/permissions';
import { articleCreateLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Publication Endpoints
 * GET  /api/publication       — List published articles (or fetch by slug, or editorial view)
 * POST /api/publication       — Create a new article draft
 */

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (slug) {
      const article = await getArticleBySlug(slug);
      if (!article) return notFoundError('Article not found');
      return NextResponse.json(successResponse(article), { status: 200 });
    }

    // If ?managed=true, return editorial workspace articles
    const managed = request.nextUrl.searchParams.get('managed');
    if (managed === 'true') {
      const user = await getCurrentUser();
      if (!user) return unauthorizedError();

      const includeAll = user.role_name ? canEditAnyArticle(user.role_name) : false;
      const status = request.nextUrl.searchParams.get('status') ?? undefined;
      const section = request.nextUrl.searchParams.get('section') ?? undefined;

      const articles = await getManagedArticles(user.id, includeAll, {
        status: status as ArticleStatus | undefined,
        section: section as ArticleSection | undefined,
      });
      return NextResponse.json(successResponse(articles), { status: 200 });
    }

    // Default: public listing
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10);
    const articles = await getPublishedArticles(limit, offset);
    return NextResponse.json(successResponse(articles), { status: 200 });
  } catch (error) {
    console.error('[Get Articles Error]', error);
    return internalError('Failed to fetch articles');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const rateLimited = articleCreateLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    if (!user.role_name || !canCreateArticle(user.role_name)) {
      return forbiddenError('You do not have permission to create articles');
    }

    const body = await request.json();
    const validated = articleCreateSchema.safeParse(body);

    if (!validated.success) {
      console.error('[Article Validation Error]', validated.error);
      return validationError('Invalid article data');
    }

    const article = await createArticle(validated.data as CreateArticleInput, user.id);
    return NextResponse.json(successResponse(article), { status: 201 });
  } catch (error) {
    console.error('[Create Article Error]', error);
    return internalError('Failed to create article');
  }
}
