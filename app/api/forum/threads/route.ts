import { createThread, getThreadsByCategory, getThreadBySlug } from '@/modules/forum/forum.service';
import { getActiveRestrictions } from '@/modules/moderation/moderation.service';
import { notifyOnForumThread } from '@/modules/notifications/notifications.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canPostInForum } from '@/shared/utils/permissions';
import { forumThreadCreateLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Forum Thread Endpoints
 * GET  /api/forum/threads?category_id=&page=&pageSize= — List threads in a category
 * GET  /api/forum/threads?slug=                        — Fetch a single thread by slug
 * POST /api/forum/threads                              — Create a new thread
 */

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (slug) {
      const thread = await getThreadBySlug(slug);
      if (!thread) return notFoundError('Thread not found');
      return NextResponse.json(successResponse(thread), { status: 200 });
    }

    const categoryId = request.nextUrl.searchParams.get('category_id');
    if (!categoryId) return validationError('category_id query parameter is required');

    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '20'))
    );

    const result = await getThreadsByCategory(categoryId, { page, pageSize });
    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    console.error('[Get Forum Threads Error]', error);
    return internalError('Failed to fetch threads');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canPostInForum(user.role_name)) {
      return forbiddenError('You do not have permission to create forum threads');
    }

    const limitError = forumThreadCreateLimiter.check(user.id);
    if (limitError) return limitError;

    // Check for active user restrictions (MUTED, SUSPENDED, BANNED)
    const restrictions = await getActiveRestrictions(user.id);
    if (restrictions.length > 0) {
      return forbiddenError('Your account is currently restricted from posting in the forum');
    }

    const body = await request.json();
    const {
      category_id,
      title,
      body: threadBody,
    } = body as {
      category_id?: string;
      title?: string;
      body?: string;
    };

    if (!category_id || !title || !threadBody) {
      return validationError('category_id, title, and body are required');
    }

    const thread = await createThread({
      category_id,
      author_id: user.id,
      title,
      body: threadBody,
    });

    // Fire-and-forget notification fan-out
    void notifyOnForumThread(thread).catch((err) => {
      console.error('[Create Forum Thread] Notification fan-out failed:', err);
    });

    return NextResponse.json(successResponse(thread), { status: 201 });
  } catch (error) {
    console.error('[Create Forum Thread Error]', error);
    return internalError('Failed to create thread');
  }
}
