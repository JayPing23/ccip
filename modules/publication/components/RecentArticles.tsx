'use client';

import { ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RecentArticlesProps {
  items: IArticle[];
  loading: boolean;
  error: string | null;
}

export default function RecentArticles({ items, loading, error }: RecentArticlesProps) {
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
        Failed to load recent articles.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-brand-accent/10 rounded-lg p-6 text-center">
        <p className="text-brand-text-primary">No campus news articles yet.</p>
        <p className="text-brand-text-muted text-sm">Check back soon for campus news!</p>
      </div>
    );
  }

  return (
    <ul className="divide-brand-secondary/10 divide-y">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/news/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-brand-text-primary group-hover:text-brand-primary truncate text-sm font-semibold">
                  {item.title}
                </h4>
                {item.excerpt && (
                  <p className="text-brand-text-secondary mt-1 line-clamp-2 text-sm">
                    {item.excerpt}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="bg-content-article/15 text-brand-primary inline-block rounded px-2 py-0.5 text-xs font-medium">
                  {ARTICLE_SECTION_LABELS[item.section] ?? item.section}
                </span>
                {item.published_at && (
                  <time className="text-brand-text-muted text-xs">
                    {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                  </time>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
