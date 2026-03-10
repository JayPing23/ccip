import { getReactionCounts, getThreadById, toggleReaction } from '@/modules/forum/forum.service';
import { REACTION_TYPE } from '@/modules/forum/constants';
import type { ReactionType } from '@/modules/forum/constants';
import { getCurrentUser } from '@/modules/users/users.service';
import {
  internalError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/shared/utils/api-errors';
import { successResponse } from '@/shared/utils/api-response';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const VALID_REACTION_TYPES = new Set(Object.values(REACTION_TYPE));

/**
 * Forum Reaction Endpoints
 * GET  /api/forum/threads/[id]/react                        — Get reaction counts
 * GET  /api/forum/threads/[id]/react?reply_id=              — Get reaction counts for a reply
 * POST /api/forum/threads/[id]/react { reaction_type, reply_id? } — Toggle a reaction
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const replyId = request.nextUrl.searchParams.get('reply_id') ?? null;

    const counts = await getReactionCounts(replyId ? null : id, replyId);
    return NextResponse.json(successResponse(counts), { status: 200 });
  } catch (error) {
    console.error('[Get Reaction Counts Error]', error);
    return internalError('Failed to fetch reaction counts');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorizedError();

    const thread = await getThreadById(id);
    if (!thread) return notFoundError('Thread not found');

    const body = await request.json();
    const { reaction_type, reply_id } = body as {
      reaction_type?: string;
      reply_id?: string | null;
    };

    if (!reaction_type || !VALID_REACTION_TYPES.has(reaction_type as ReactionType)) {
      return validationError(
        `reaction_type must be one of: ${Object.values(REACTION_TYPE).join(', ')}`
      );
    }

    const result = await toggleReaction(
      user.id,
      reaction_type as ReactionType,
      reply_id ? null : id,
      reply_id ?? null
    );

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    console.error('[Toggle Reaction Error]', error);
    return internalError('Failed to toggle reaction');
  }
}
