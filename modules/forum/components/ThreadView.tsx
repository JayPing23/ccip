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
          <div key={i} className="bg-brand-secondary/20 h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-status-error/20 bg-status-error/10 text-status-error rounded-lg border p-4 text-sm">
        {error}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="border-brand-secondary/20 bg-brand-surface text-brand-text-muted rounded-lg border p-8 text-center">
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
          className="border-brand-secondary/20 bg-brand-surface hover:border-brand-secondary block rounded-lg border p-4 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {thread.pinned && (
                  <span className="text-status-warning shrink-0 text-xs font-medium">
                    📌 Pinned
                  </span>
                )}
                <h3 className="text-brand-text-primary truncate text-base font-semibold">
                  {thread.title}
                </h3>
              </div>
              <p className="text-brand-text-muted mt-1 text-xs">
                {new Date(thread.created_at).toLocaleDateString()} · {thread.reply_count}{' '}
                {thread.reply_count === 1 ? 'reply' : 'replies'}
              </p>
            </div>
            {thread.status !== 'OPEN' && (
              <span className="bg-brand-secondary/10 text-brand-text-secondary shrink-0 rounded px-2 py-0.5 text-xs font-medium">
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
          {thread.pinned && (
            <span className="text-status-warning text-xs font-medium">📌 Pinned</span>
          )}
          {thread.status !== 'OPEN' && (
            <span className="bg-brand-secondary/10 text-brand-text-secondary rounded px-2 py-0.5 text-xs font-medium">
              {THREAD_STATUS_LABELS[thread.status]}
            </span>
          )}
        </div>
        <h1 className="text-brand-text-primary mt-1 text-2xl font-bold">{thread.title}</h1>
        <p className="text-brand-text-muted mt-1 text-sm">
          Posted on {new Date(thread.created_at).toLocaleDateString()} · {thread.reply_count}{' '}
          {thread.reply_count === 1 ? 'reply' : 'replies'}
        </p>
      </div>

      {/* Thread body */}
      <div className="prose border-brand-secondary/20 bg-brand-surface max-w-none rounded-lg border p-5">
        <p className="whitespace-pre-wrap">{thread.body}</p>
      </div>

      {/* Thread-level reaction counts */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="text-brand-text-secondary flex gap-3 text-sm">
          {Object.entries(reactionCounts).map(([type, count]) => (
            <span key={type} className="bg-brand-secondary/10 rounded px-2 py-0.5">
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
          <h2 className="text-brand-text-primary mb-3 text-lg font-semibold">
            Replies ({replies.length})
          </h2>
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
      <div className="border-brand-secondary/20 bg-brand-bg text-brand-text-muted rounded-lg border p-4 text-sm italic">
        This reply has been removed.
      </div>
    );
  }

  if (reply.status === 'HIDDEN') {
    return (
      <div className="border-brand-secondary/20 bg-brand-bg text-brand-text-muted rounded-lg border p-4 text-sm italic">
        This reply has been hidden by a moderator.
      </div>
    );
  }

  return (
    <div
      className={`border-brand-secondary/20 bg-brand-surface rounded-lg border p-4 ${
        reply.parent_reply_id ? 'ml-6' : ''
      }`}
    >
      <p className="text-brand-text-primary text-sm whitespace-pre-wrap">{reply.body}</p>
      <p className="text-brand-text-muted mt-2 text-xs">
        {new Date(reply.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
