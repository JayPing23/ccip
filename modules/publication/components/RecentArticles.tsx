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
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recent articles.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 text-center">
        <p className="text-gray-700">No campus news articles yet.</p>
        <p className="text-sm text-gray-500">Check back soon for campus news!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <Link href={`/news/${item.slug}`} className="group block">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                  {item.title}
                </h4>
                {item.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.excerpt}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {ARTICLE_SECTION_LABELS[item.section] ?? item.section}
                </span>
                {item.published_at && (
                  <time className="text-xs text-gray-400">
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
