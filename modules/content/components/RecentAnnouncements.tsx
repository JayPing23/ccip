'use client';

import type { IContent } from '@/shared/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RecentAnnouncementsProps {
  items: IContent[];
  loading: boolean;
  error: string | null;
}

export default function RecentAnnouncements({ items, loading, error }: RecentAnnouncementsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recent announcements.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 text-center">
        <p className="text-gray-700">No announcements yet.</p>
        <p className="text-sm text-gray-500">Check back soon for updates!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/content/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                  {item.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.body}</p>
              </div>
              <time className="shrink-0 text-xs text-gray-400">
                {formatDistanceToNow(new Date(item.published_at ?? item.created_at), {
                  addSuffix: true,
                })}
              </time>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{item.tags.length - 3} more</span>
                )}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
