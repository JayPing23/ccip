'use client';

import type { IForumThread } from '@/modules/forum/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RecentThreadsProps {
  items: IForumThread[];
  loading: boolean;
  error: string | null;
}

export default function RecentThreads({ items, loading, error }: RecentThreadsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-brand-secondary/20 h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-error/10 text-status-error rounded-lg p-4 text-sm">
        Failed to load recent threads.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-brand-accent/10 rounded-lg p-6 text-center">
        <p className="text-brand-text-primary">No forum discussions yet.</p>
        <p className="text-brand-text-muted text-sm">Start or join a conversation in the forum!</p>
      </div>
    );
  }

  return (
    <ul className="divide-brand-secondary/10 divide-y">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/forum/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-brand-text-primary group-hover:text-brand-primary truncate text-sm font-semibold">
                  {item.pinned && (
                    <span className="mr-1.5 text-amber-500" aria-label="Pinned">
                      📌
                    </span>
                  )}
                  {item.title}
                </h4>
                <p className="text-brand-text-muted mt-1 text-xs">
                  {item.reply_count} {item.reply_count === 1 ? 'reply' : 'replies'}
                </p>
              </div>
              <time className="text-brand-text-muted shrink-0 text-xs">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
