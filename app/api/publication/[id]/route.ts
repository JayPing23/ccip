import {
  deleteArticle,
  getArticleById,
  updateArticle,
} from '@/modules/publication/publication.service';
import { articleUpdateSchema } from '@/modules/publication/schemas/article.schema';
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
  canDeleteAnyArticle,
  canDeleteOwnArticle,
  canEditAnyArticle,
  canEditOwnArticle,
} from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Single Article Endpoints
 * GET    /api/publication/[id]  — Get article by ID
 * PATCH  /api/publication/[id]  — Update article fields
 * DELETE /api/publication/[id]  — Soft-delete article
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) return notFoundError('Article not found');
    return NextResponse.json(successResponse(article), { status: 200 });
  } catch (error) {
    console.error('[Get Article Detail Error]', error);
    return internalError('Failed to fetch article');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const article = await getArticleById(id);
    if (!article) return notFoundError('Article not found');

    const isOwner = article.author_id === user.id;
    const canEdit = isOwner
      ? user.role_name ? canEditOwnArticle(user.role_name) : false
      : user.role_name ? canEditAnyArticle(user.role_name) : false;

    if (!canEdit) {
      return forbiddenError('You do not have permission to edit this article');
    }

    const body = await request.json();
    const validated = articleUpdateSchema.safeParse(body);

    if (!validated.success) {
      return validationError('Invalid article data');
    }

    const updates: Parameters<typeof updateArticle>[1] = {};
    if (validated.data.title !== undefined) updates.title = validated.data.title;
    if (validated.data.body !== undefined) updates.body = validated.data.body;
    if (validated.data.excerpt !== undefined) updates.excerpt = validated.data.excerpt;
    if (validated.data.section !== undefined) {
      updates.section = validated.data.section as Parameters<typeof updateArticle>[1]['section'];
    }

    const updated = await updateArticle(id, updates, user.id);
    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    console.error('[Update Article Error]', error);
    return internalError('Failed to update article');
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

    const article = await getArticleById(id);
    if (!article) return notFoundError('Article not found');

    const isOwner = article.author_id === user.id;
    const canDelete = isOwner
      ? user.role_name ? canDeleteOwnArticle(user.role_name) : false
      : user.role_name ? canDeleteAnyArticle(user.role_name) : false;

    if (!canDelete) {
      return forbiddenError('You do not have permission to delete this article');
    }

    const deleted = await deleteArticle(id, user.id);
    return NextResponse.json(successResponse(deleted), { status: 200 });
  } catch (error) {
    console.error('[Delete Article Error]', error);
    return internalError('Failed to delete article');
  }
}
