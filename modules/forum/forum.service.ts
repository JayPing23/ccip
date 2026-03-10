/**
 * Forum Service
 * Handles all database interactions for the forum module:
 *   P4-05 — categories and thread lifecycle
 *   P4-06 — replies and reactions
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase-server';
import { THREAD_STATUS } from '@/modules/forum/constants';
import type { ThreadStatus, ReactionType } from '@/modules/forum/constants';
import type {
  IForumCategory,
  IForumThread,
  IForumReply,
  IForumReaction,
  CreateThreadInput,
  UpdateThreadInput,
  ThreadListOptions,
  CreateReplyInput,
  ReactionToggleResult,
} from '@/modules/forum/types';
import { appendUuidToSlug, generateSlug } from '@/shared/utils/slugify';

// ===========================================================================
// Audit helper (mirrors content.service.ts pattern)
// ===========================================================================

async function logAuditEvent(
  tableName: string,
  recordId: string,
  action: string,
  userId: string,
  before: object | null,
  after: object | null
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    user_id: userId,
    diff: { before, after },
  });

  if (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ===========================================================================
// P4-05 — Categories
// ===========================================================================

/** List all forum categories ordered by display_order. */
export async function getCategories(): Promise<IForumCategory[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IForumCategory[];
}

/** Get a single forum category by its slug. */
export async function getCategoryBySlug(slug: string): Promise<IForumCategory | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IForumCategory) : null;
}

/** Get a single forum category by its ID. */
export async function getCategoryById(categoryId: string): Promise<IForumCategory | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IForumCategory) : null;
}

// ===========================================================================
// P4-05 — Threads
// ===========================================================================

/** Check whether a thread slug already exists. */
async function threadSlugExists(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** List threads in a category with pagination. Pinned threads appear first by default. */
export async function getThreadsByCategory(
  categoryId: string,
  options: ThreadListOptions = {}
): Promise<{ threads: IForumThread[]; total: number }> {
  const { page = 1, pageSize = 20, pinFirst = true } = options;
  const offset = (page - 1) * pageSize;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('forum_threads')
    .select('*', { count: 'exact' })
    .eq('category_id', categoryId)
    .is('deleted_at', null)
    .neq('status', THREAD_STATUS.REMOVED);

  if (pinFirst) {
    query = query.order('pinned', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);
  return { threads: data as IForumThread[], total: count ?? 0 };
}

/** Get a single thread by its slug. */
export async function getThreadBySlug(slug: string): Promise<IForumThread | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .neq('status', THREAD_STATUS.REMOVED)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IForumThread) : null;
}

/** Get a single thread by its ID. */
export async function getThreadById(threadId: string): Promise<IForumThread | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('id', threadId)
    .is('deleted_at', null)
    .neq('status', THREAD_STATUS.REMOVED)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IForumThread) : null;
}

/** Create a new forum thread with an auto-generated unique slug. */
export async function createThread(input: CreateThreadInput): Promise<IForumThread> {
  const supabase = createServiceRoleClient();

  let slug = generateSlug(input.title);
  while (await threadSlugExists(slug)) {
    slug = appendUuidToSlug(slug);
  }

  const { data, error } = await supabase
    .from('forum_threads')
    .insert({
      category_id: input.category_id,
      author_id: input.author_id,
      title: input.title,
      body: input.body,
      slug,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const thread = data as IForumThread;

  await logAuditEvent('forum_threads', thread.id, 'INSERT', input.author_id, null, thread);
  return thread;
}

/** Update title / body of a thread. */
export async function updateThread(
  threadId: string,
  updates: UpdateThreadInput,
  userId: string
): Promise<IForumThread> {
  const supabase = createServiceRoleClient();

  const before = await getThreadById(threadId);
  if (!before) throw new Error('Thread not found');

  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('forum_threads')
    .update(payload)
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const thread = data as IForumThread;

  await logAuditEvent('forum_threads', threadId, 'UPDATE', userId, before, thread);
  return thread;
}

/** Soft-delete a thread by setting deleted_at. */
export async function deleteThread(threadId: string, userId: string): Promise<IForumThread> {
  const supabase = createServiceRoleClient();

  const before = await getThreadById(threadId);
  if (!before) throw new Error('Thread not found');

  const { data, error } = await supabase
    .from('forum_threads')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const thread = data as IForumThread;

  await logAuditEvent('forum_threads', threadId, 'DELETE', userId, before, thread);
  return thread;
}

/** Change thread status (OPEN, LOCKED, HIDDEN, REMOVED). */
export async function setThreadStatus(
  threadId: string,
  status: ThreadStatus,
  userId: string
): Promise<IForumThread> {
  const supabase = createServiceRoleClient();

  const before = await getThreadById(threadId);
  if (!before) throw new Error('Thread not found');

  const { data, error } = await supabase
    .from('forum_threads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const thread = data as IForumThread;

  await logAuditEvent('forum_threads', threadId, 'UPDATE', userId, before, thread);
  return thread;
}

/** Toggle the pinned flag on a thread. */
export async function toggleThreadPin(
  threadId: string,
  pinned: boolean,
  userId: string
): Promise<IForumThread> {
  const supabase = createServiceRoleClient();

  const before = await getThreadById(threadId);
  if (!before) throw new Error('Thread not found');

  const { data, error } = await supabase
    .from('forum_threads')
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const thread = data as IForumThread;

  await logAuditEvent('forum_threads', threadId, 'UPDATE', userId, before, thread);
  return thread;
}

// ===========================================================================
// P4-06 — Replies
// ===========================================================================

/** Get visible replies for a thread, ordered chronologically. */
export async function getRepliesByThread(threadId: string): Promise<IForumReply[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('thread_id', threadId)
    .is('deleted_at', null)
    .neq('status', 'REMOVED')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IForumReply[];
}

/** Get a single reply by ID. */
export async function getReplyById(replyId: string): Promise<IForumReply | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('id', replyId)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IForumReply) : null;
}

/** Create a reply (optionally nested under a parent reply) and bump reply_count. */
export async function createReply(input: CreateReplyInput): Promise<IForumReply> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('forum_replies')
    .insert({
      thread_id: input.thread_id,
      author_id: input.author_id,
      body: input.body,
      parent_reply_id: input.parent_reply_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const reply = data as IForumReply;

  // Increment thread reply_count
  const { data: threadData } = await supabase
    .from('forum_threads')
    .select('reply_count')
    .eq('id', input.thread_id)
    .single();

  if (threadData) {
    await supabase
      .from('forum_threads')
      .update({ reply_count: (threadData.reply_count ?? 0) + 1 })
      .eq('id', input.thread_id);
  }

  await logAuditEvent('forum_replies', reply.id, 'INSERT', input.author_id, null, reply);
  return reply;
}

/** Update the body of a reply. */
export async function updateReply(
  replyId: string,
  body: string,
  userId: string
): Promise<IForumReply> {
  const supabase = createServiceRoleClient();

  const before = await getReplyById(replyId);
  if (!before) throw new Error('Reply not found');

  const { data, error } = await supabase
    .from('forum_replies')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', replyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const reply = data as IForumReply;

  await logAuditEvent('forum_replies', replyId, 'UPDATE', userId, before, reply);
  return reply;
}

/** Soft-delete a reply. */
export async function deleteReply(replyId: string, userId: string): Promise<IForumReply> {
  const supabase = createServiceRoleClient();

  const before = await getReplyById(replyId);
  if (!before) throw new Error('Reply not found');

  const { data, error } = await supabase
    .from('forum_replies')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', replyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const reply = data as IForumReply;

  await logAuditEvent('forum_replies', replyId, 'DELETE', userId, before, reply);
  return reply;
}

// ===========================================================================
// P4-06 — Reactions
// ===========================================================================

/**
 * Toggle a reaction: adds it if absent, removes it if it already exists.
 * Exactly one of threadId or replyId must be provided.
 */
export async function toggleReaction(
  userId: string,
  reactionType: ReactionType,
  threadId: string | null,
  replyId: string | null
): Promise<ReactionToggleResult> {
  if ((!threadId && !replyId) || (threadId && replyId)) {
    throw new Error('Exactly one of threadId or replyId must be provided');
  }

  const supabase = createServiceRoleClient();

  // Check for an existing reaction
  let query = supabase
    .from('forum_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('reaction_type', reactionType);

  if (threadId) query = query.eq('thread_id', threadId);
  if (replyId) query = query.eq('reply_id', replyId);

  const { data: existing, error: findError } = await query.maybeSingle();
  if (findError) throw new Error(findError.message);

  if (existing) {
    // Remove the existing reaction
    const { error: delError } = await supabase
      .from('forum_reactions')
      .delete()
      .eq('id', (existing as IForumReaction).id);

    if (delError) throw new Error(delError.message);
    return { added: false, reaction: null };
  }

  // Insert new reaction
  const { data, error: insertError } = await supabase
    .from('forum_reactions')
    .insert({
      user_id: userId,
      thread_id: threadId,
      reply_id: replyId,
      reaction_type: reactionType,
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return { added: true, reaction: data as IForumReaction };
}

/** Get aggregated reaction counts for a thread or reply. */
export async function getReactionCounts(
  threadId: string | null,
  replyId: string | null
): Promise<Record<string, number>> {
  if ((!threadId && !replyId) || (threadId && replyId)) {
    throw new Error('Exactly one of threadId or replyId must be provided');
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase.from('forum_reactions').select('reaction_type');

  if (threadId) query = query.eq('thread_id', threadId);
  if (replyId) query = query.eq('reply_id', replyId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const rt = (row as { reaction_type: string }).reaction_type;
    counts[rt] = (counts[rt] ?? 0) + 1;
  }
  return counts;
}
