import { deleteThread, getThreadById, updateThread } from '@/modules/forum/forum.service';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  forbiddenError,
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import { canModerate } from '@/shared/utils/permissions';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Forum Thread Detail Endpoints
 * GET    /api/forum/threads/[id] — Get a single thread
 * PATCH  /api/forum/threads/[id] — Update thread (owner or moderator)
 * DELETE /api/forum/threads/[id] — Soft-delete thread (owner or moderator)
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');
    return NextResponse.json(successResponse(thread), { status: 200 });
  } catch (error) {
    console.error('[Get Forum Thread Detail Error]', error);
    return internalError('Failed to fetch thread');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    const isOwner = thread.author_id === user.id;
    const isModerator = user.role_name ? canModerate(user.role_name) : false;

    if (!isOwner && !isModerator) {
      return forbiddenError('You do not have permission to edit this thread');
    }

    const body = await request.json();
    const { title, body: threadBody } = body as { title?: string; body?: string };

    if (!title && !threadBody) {
      return validationError('At least one of title or body is required');
    }

    const updated = await updateThread(
      id,
      { ...(title ? { title } : {}), ...(threadBody ? { body: threadBody } : {}) },
      user.id
    );

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    console.error('[Update Forum Thread Error]', error);
    return internalError('Failed to update thread');
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

    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    const isOwner = thread.author_id === user.id;
    const isModerator = user.role_name ? canModerate(user.role_name) : false;

    if (!isOwner && !isModerator) {
      return forbiddenError('You do not have permission to delete this thread');
    }

    const deleted = await deleteThread(id, user.id);
    return NextResponse.json(successResponse(deleted), { status: 200 });
  } catch (error) {
    console.error('[Delete Forum Thread Error]', error);
    return internalError('Failed to delete thread');
  }
}
