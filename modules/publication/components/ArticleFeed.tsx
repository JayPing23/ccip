'use client';

import type { ArticleSection } from '@/modules/publication/constants';
import { ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import EmptyState from '@/shared/components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ArticleFeedProps {
  sectionFilter?: ArticleSection;
  showFilters?: boolean;
  layout?: 'list' | 'magazine';
}

/**
 * ArticleFeed Component
 * Displays a feed of published campus news articles with optional section filtering.
 */
export default function ArticleFeed({
  sectionFilter,
  showFilters = true,
  layout = 'list',
}: ArticleFeedProps) {
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
          <div key={i} className="bg-brand-secondary/20 h-32 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-error/10 text-status-error rounded-lg p-4">
        <p className="font-medium">Failed to load articles</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return <EmptyState type="article" />;
  }

  return (
    <div>
      {showFilters && (
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="section-filter" className="text-brand-text-primary text-sm font-medium">
            Section:
          </label>
          <select
            id="section-filter"
            value={section}
            onChange={(e) => setSection(e.target.value as ArticleSection | '')}
            className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 rounded border px-3 py-2 text-sm"
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

      {layout === 'magazine' && articles.length > 0 ? (
        <div>
          {/* Featured article (first) */}
          <article className="bg-brand-surface border-brand-secondary/20 mb-6 rounded-lg border p-8 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md">
            <span className="bg-content-article/15 text-brand-primary mb-3 inline-block rounded px-2 py-0.5 text-xs font-medium">
              {ARTICLE_SECTION_LABELS[articles[0].section] ?? articles[0].section}
            </span>
            <h2 className="text-brand-text-primary hover:text-brand-primary/80 mb-2 text-2xl font-bold lg:text-3xl">
              <Link href={`/news/${articles[0].slug}`}>{articles[0].title}</Link>
            </h2>
            {articles[0].excerpt && (
              <p className="text-brand-text-secondary mb-3 leading-relaxed">
                {articles[0].excerpt}
              </p>
            )}
            <div className="text-brand-text-muted text-xs">
              {articles[0].published_at && (
                <span>
                  Published{' '}
                  {formatDistanceToNow(new Date(articles[0].published_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </article>

          {/* Remaining articles in grid */}
          {articles.length > 1 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.slice(1).map((article) => (
                <article
                  key={article.id}
                  className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md"
                >
                  <span className="bg-content-article/15 text-brand-primary mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium">
                    {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
                  </span>
                  <h3 className="text-brand-text-primary hover:text-brand-primary/80 mb-1 text-lg font-semibold">
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h3>
                  {article.excerpt && (
                    <p className="text-brand-text-secondary mb-2 line-clamp-2 text-sm">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="text-brand-text-muted text-xs">
                    {article.published_at && (
                      <span>
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-brand-text-primary hover:text-brand-primary/80 mb-1 text-xl font-semibold">
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-content-article/15 text-brand-primary inline-block rounded px-2 py-0.5 text-xs font-medium">
                      {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
                    </span>
                  </div>
                </div>
              </div>

              {article.excerpt && (
                <p className="text-brand-text-secondary mb-3 text-sm leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              <div className="text-brand-text-muted text-xs">
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
      )}
    </div>
  );
}
