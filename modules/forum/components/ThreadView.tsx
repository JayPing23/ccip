'use client';

import { THREAD_STATUS_LABELS } from '@/modules/forum/constants';
import type { IForumReply, IForumThread } from '@/modules/forum/types';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// ThreadList — renders a list of threads within a category
// ---------------------------------------------------------------------------

interface ThreadListProps {
  threads: IForumThread[];
  loading?: boolean;
  error?: string | null;
}

export function ThreadList({ threads, loading, error }: ThreadListProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        No threads in this category yet. Start a discussion!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/forum/thread/${thread.slug}`}
          className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {thread.pinned && (
                  <span className="shrink-0 text-xs font-medium text-amber-600">📌 Pinned</span>
                )}
                <h3 className="truncate text-base font-semibold text-gray-900">{thread.title}</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(thread.created_at).toLocaleDateString()} · {thread.reply_count}{' '}
                {thread.reply_count === 1 ? 'reply' : 'replies'}
              </p>
            </div>
            {thread.status !== 'OPEN' && (
              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {THREAD_STATUS_LABELS[thread.status]}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThreadView — displays a single thread's content and metadata
// ---------------------------------------------------------------------------

interface ThreadViewProps {
  thread: IForumThread;
  replies: IForumReply[];
  reactionCounts: Record<string, number>;
  /** Slot for reaction bar, composer, etc. */
  children?: React.ReactNode;
}

export default function ThreadView({ thread, replies, reactionCounts, children }: ThreadViewProps) {
  return (
    <article className="space-y-6">
      {/* Thread header */}
      <div>
        <div className="flex items-center gap-2">
          {thread.pinned && <span className="text-xs font-medium text-amber-600">📌 Pinned</span>}
          {thread.status !== 'OPEN' && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {THREAD_STATUS_LABELS[thread.status]}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{thread.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Posted on {new Date(thread.created_at).toLocaleDateString()} · {thread.reply_count}{' '}
          {thread.reply_count === 1 ? 'reply' : 'replies'}
        </p>
      </div>

      {/* Thread body */}
      <div className="prose max-w-none rounded-lg border border-gray-200 bg-white p-5">
        <p className="whitespace-pre-wrap">{thread.body}</p>
      </div>

      {/* Thread-level reaction counts */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex gap-3 text-sm text-gray-600">
          {Object.entries(reactionCounts).map(([type, count]) => (
            <span key={type} className="rounded bg-gray-100 px-2 py-0.5">
              {type} {count}
            </span>
          ))}
        </div>
      )}

      {/* Slot for interactive controls (reaction bar, composer) */}
      {children}

      {/* Replies */}
      {replies.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Replies ({replies.length})</h2>
          <div className="space-y-3">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// ReplyCard — a single reply within a thread
// ---------------------------------------------------------------------------

function ReplyCard({ reply }: { reply: IForumReply }) {
  if (reply.status === 'REMOVED') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400 italic">
        This reply has been removed.
      </div>
    );
  }

  if (reply.status === 'HIDDEN') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400 italic">
        This reply has been hidden by a moderator.
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${
        reply.parent_reply_id ? 'ml-6' : ''
      }`}
    >
      <p className="text-sm whitespace-pre-wrap text-gray-800">{reply.body}</p>
      <p className="mt-2 text-xs text-gray-400">
        {new Date(reply.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
