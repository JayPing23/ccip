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
          <div key={i} className="bg-brand-secondary/20 h-20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-error/10 text-status-error rounded-lg p-4 text-sm">
        Failed to load recent announcements.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-brand-accent/10 rounded-lg p-6 text-center">
        <p className="text-brand-text-primary">No announcements yet.</p>
        <p className="text-brand-text-muted text-sm">Check back soon for updates!</p>
      </div>
    );
  }

  return (
    <ul className="divide-brand-secondary/10 divide-y">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/content/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-brand-text-primary group-hover:text-brand-primary truncate text-sm font-semibold">
                  {item.title}
                </h4>
                <p className="text-brand-text-secondary mt-1 line-clamp-2 text-sm">{item.body}</p>
              </div>
              <time className="text-brand-text-muted shrink-0 text-xs">
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
                    className="bg-brand-secondary/10 text-brand-text-secondary inline-block rounded-full px-2 py-0.5 text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-brand-text-muted text-xs">
                    +{item.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
