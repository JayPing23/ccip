import type { ReactionType, ReplyStatus, ThreadStatus } from '@/modules/forum/constants';

export interface IForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface IForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  body: string;
  slug: string;
  status: ThreadStatus;
  pinned: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  status: ReplyStatus;
  parent_reply_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IForumReaction {
  id: string;
  user_id: string;
  thread_id: string | null;
  reply_id: string | null;
  reaction_type: ReactionType;
  created_at: string;
}

export interface IForumThreadWithCategory extends IForumThread {
  category?: IForumCategory;
}

// ---------------------------------------------------------------------------
// Service input / option types
// ---------------------------------------------------------------------------

export interface CreateThreadInput {
  category_id: string;
  author_id: string;
  title: string;
  body: string;
}

export interface UpdateThreadInput {
  title?: string;
  body?: string;
}

export interface ThreadListOptions {
  page?: number;
  pageSize?: number;
  pinFirst?: boolean;
}

export interface CreateReplyInput {
  thread_id: string;
  author_id: string;
  body: string;
  parent_reply_id?: string | null;
}

export interface ReactionToggleResult {
  added: boolean;
  reaction: IForumReaction | null;
}
