'use client';

import { ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { ArticleSection } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ArticleFeedProps {
  sectionFilter?: ArticleSection;
  showFilters?: boolean;
}

/**
 * ArticleFeed Component
 * Displays a feed of published campus news articles with optional section filtering.
 */
export default function ArticleFeed({ sectionFilter, showFilters = true }: ArticleFeedProps) {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<ArticleSection | ''>(sectionFilter ?? '');

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (section) params.append('section', section);

        const url = `/api/publication${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('Failed to load articles');

        const json = await res.json();
        setArticles(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchArticles();
  }, [section]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load articles</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-8 text-center">
        <p className="text-gray-700">No articles yet.</p>
        <p className="text-sm text-gray-500">Check back soon for campus news!</p>
      </div>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="section-filter" className="text-sm font-medium text-gray-700">
            Section:
          </label>
          <select
            id="section-filter"
            value={section}
            onChange={(e) => setSection(e.target.value as ArticleSection | '')}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Sections</option>
            {Object.entries(ARTICLE_SECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="mb-1 text-xl font-semibold text-gray-900 hover:text-blue-600">
                  <Link href={`/news/${article.slug}`}>{article.title}</Link>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
                  </span>
                </div>
              </div>
            </div>

            {article.excerpt && (
              <p className="mb-3 text-sm leading-relaxed text-gray-600">{article.excerpt}</p>
            )}

            <div className="text-xs text-gray-500">
              {article.published_at && (
                <span>
                  Published{' '}
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
