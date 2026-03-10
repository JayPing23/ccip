'use client';

import type { ReactionType } from '@/modules/forum/constants';
import type { IForumCategory, IForumReply, IForumThread } from '@/modules/forum/types';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// useForumCategories — fetch all forum categories
// ---------------------------------------------------------------------------

export function useForumCategories() {
  const [categories, setCategories] = useState<IForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/forum/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const json = await res.json();
        setCategories(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchCategories();
  }, []);

  return { categories, loading, error };
}

// ---------------------------------------------------------------------------
// useForumThreads — list threads by category with pagination
// ---------------------------------------------------------------------------

interface UseForumThreadsOptions {
  categoryId: string | null;
  page?: number;
  pageSize?: number;
}

export function useForumThreads({ categoryId, page = 1, pageSize = 20 }: UseForumThreadsOptions) {
  const [threads, setThreads] = useState<IForumThread[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        category_id: categoryId,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/forum/threads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch threads');
      const json = await res.json();
      const data = json.data ?? {};
      setThreads(data.threads ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { threads, total, loading, error, refresh };
}

// ---------------------------------------------------------------------------
// useForumThread — single thread by slug, its replies, and reaction counts
// ---------------------------------------------------------------------------

interface UseForumThreadResult {
  thread: IForumThread | null;
  replies: IForumReply[];
  reactionCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  refreshThread: () => Promise<void>;
  refreshReplies: () => Promise<void>;
  refreshReactions: () => Promise<void>;
}

export function useForumThread(slug: string | null): UseForumThreadResult {
  const [thread, setThread] = useState<IForumThread | null>(null);
  const [replies, setReplies] = useState<IForumReply[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThread = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/forum/threads?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Failed to fetch thread');
    const json = await res.json();
    setThread(json.data ?? null);
  }, [slug]);

  const refreshReplies = useCallback(async () => {
    if (!thread) return;
    const res = await fetch(`/api/forum/threads/${thread.id}/reply`);
    if (!res.ok) throw new Error('Failed to fetch replies');
    const json = await res.json();
    setReplies(json.data ?? []);
  }, [thread]);

  const refreshReactions = useCallback(async () => {
    if (!thread) return;
    const res = await fetch(`/api/forum/threads/${thread.id}/react`);
    if (!res.ok) throw new Error('Failed to fetch reactions');
    const json = await res.json();
    setReactionCounts(json.data ?? {});
  }, [thread]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const threadRes = await fetch(`/api/forum/threads?slug=${encodeURIComponent(slug!)}`);
        if (!threadRes.ok) throw new Error('Failed to fetch thread');
        const threadJson = await threadRes.json();
        const fetchedThread = threadJson.data as IForumThread | null;
        if (cancelled) return;
        setThread(fetchedThread);

        if (fetchedThread) {
          const [repliesRes, reactRes] = await Promise.all([
            fetch(`/api/forum/threads/${fetchedThread.id}/reply`),
            fetch(`/api/forum/threads/${fetchedThread.id}/react`),
          ]);

          if (cancelled) return;

          if (repliesRes.ok) {
            const repliesJson = await repliesRes.json();
            setReplies(repliesJson.data ?? []);
          }
          if (reactRes.ok) {
            const reactJson = await reactRes.json();
            setReactionCounts(reactJson.data ?? {});
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load thread');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return {
    thread,
    replies,
    reactionCounts,
    loading,
    error,
    refreshThread,
    refreshReplies,
    refreshReactions,
  };
}

// ---------------------------------------------------------------------------
// useCreateThread — create a new thread
// ---------------------------------------------------------------------------

interface UseCreateThreadResult {
  createThread: (categoryId: string, title: string, body: string) => Promise<IForumThread | null>;
  loading: boolean;
  error: string | null;
}

export function useCreateThread(): UseCreateThreadResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createThread = useCallback(async (categoryId: string, title: string, body: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, title, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create thread');
      return json.data as IForumThread;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create thread';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createThread, loading, error };
}

// ---------------------------------------------------------------------------
// useCreateReply — post a reply to a thread
// ---------------------------------------------------------------------------

interface UseCreateReplyResult {
  createReply: (
    threadId: string,
    body: string,
    parentReplyId?: string | null
  ) => Promise<IForumReply | null>;
  loading: boolean;
  error: string | null;
}

export function useCreateReply(): UseCreateReplyResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReply = useCallback(
    async (threadId: string, body: string, parentReplyId?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/forum/threads/${threadId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body, parent_reply_id: parentReplyId ?? null }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? 'Failed to post reply');
        return json.data as IForumReply;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to post reply';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createReply, loading, error };
}

// ---------------------------------------------------------------------------
// useToggleReaction — toggle a reaction on a thread or reply
// ---------------------------------------------------------------------------

interface UseToggleReactionResult {
  toggleReaction: (
    threadId: string,
    reactionType: ReactionType,
    replyId?: string | null
  ) => Promise<boolean>;
  loading: boolean;
}

export function useToggleReaction(): UseToggleReactionResult {
  const [loading, setLoading] = useState(false);

  const toggleReaction = useCallback(
    async (threadId: string, reactionType: ReactionType, replyId?: string | null) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/forum/threads/${threadId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: reactionType, reply_id: replyId ?? null }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { toggleReaction, loading };
}

// ---------------------------------------------------------------------------
// useReportContent — submit a moderation report
// ---------------------------------------------------------------------------

interface UseReportContentResult {
  reportContent: (
    threadId: string,
    reason: string,
    description?: string,
    replyId?: string | null
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useReportContent(): UseReportContentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportContent = useCallback(
    async (threadId: string, reason: string, description?: string, replyId?: string | null) => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/forum/threads/${threadId}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason,
            description: description ?? null,
            reply_id: replyId ?? null,
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error?.message ?? 'Failed to submit report');
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit report');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { reportContent, loading, error };
}
