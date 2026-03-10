import { createReply, getRepliesByThread, getThreadById } from '@/modules/forum/forum.service';
import { getActiveRestrictions } from '@/modules/moderation/moderation.service';
import { notifyOnForumReply } from '@/modules/notifications/notifications.service';
import { THREAD_STATUS } from '@/modules/forum/constants';
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
import { forumReplyCreateLimiter } from '@/shared/utils/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Forum Reply Endpoints
 * GET  /api/forum/threads/[id]/reply — List replies for a thread
 * POST /api/forum/threads/[id]/reply — Create a reply
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    const replies = await getRepliesByThread(id);
    return NextResponse.json(successResponse(replies), { status: 200 });
  } catch (error) {
    console.error('[Get Forum Replies Error]', error);
    return internalError('Failed to fetch replies');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    if (!user.role_name || !canPostInForum(user.role_name)) {
      return forbiddenError('You do not have permission to reply in the forum');
    }

    const limitError = forumReplyCreateLimiter.check(user.id);
    if (limitError) return limitError;

    // Check for active user restrictions
    const restrictions = await getActiveRestrictions(user.id);
    if (restrictions.length > 0) {
      return forbiddenError('Your account is currently restricted from posting in the forum');
    }

    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    if (thread.status === THREAD_STATUS.LOCKED) {
      return forbiddenError('This thread is locked and no longer accepts replies');
    }

    const body = await request.json();
    const { body: replyBody, parent_reply_id } = body as {
      body?: string;
      parent_reply_id?: string | null;
    };

    if (!replyBody) {
      return validationError('body is required');
    }

    const reply = await createReply({
      thread_id: id,
      author_id: user.id,
      body: replyBody,
      parent_reply_id: parent_reply_id ?? null,
    });

    // Fire-and-forget reply notification to thread author
    void notifyOnForumReply({
      thread_id: thread.id,
      thread_title: thread.title,
      thread_author_id: thread.author_id,
      reply_author_id: user.id,
    }).catch((err) => {
      console.error('[Create Forum Reply] Notification failed:', err);
    });

    return NextResponse.json(successResponse(reply), { status: 201 });
  } catch (error) {
    console.error('[Create Forum Reply Error]', error);
    return internalError('Failed to create reply');
  }
}
