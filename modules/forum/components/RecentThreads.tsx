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
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recent threads.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 text-center">
        <p className="text-gray-700">No forum discussions yet.</p>
        <p className="text-sm text-gray-500">Start or join a conversation in the forum!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/forum/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                  {item.pinned && (
                    <span className="mr-1.5 text-amber-500" aria-label="Pinned">
                      📌
                    </span>
                  )}
                  {item.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {item.reply_count} {item.reply_count === 1 ? 'reply' : 'replies'}
                </p>
              </div>
              <time className="shrink-0 text-xs text-gray-400">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
