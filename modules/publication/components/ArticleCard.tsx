'use client';

import { ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { IArticleWithAuthors } from '@/modules/publication/types';
import StatusBadge from '@/shared/components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ArticleCardProps {
  article: IArticleWithAuthors;
  className?: string;
}

const statusVariant = {
  DRAFT: 'draft' as const,
  IN_REVIEW: 'in-review' as const,
  APPROVED: 'in-review' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
};

export default function ArticleCard({ article, className }: ArticleCardProps) {
  const primaryAuthor = article.article_authors?.find((a) => a.role === 'primary');
  const byline = primaryAuthor?.byline_name;

  return (
    <article
      className={`bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md ${className ?? ''}`}
    >
      {/* Content-type color marker */}
      <div className="bg-content-article mb-4 h-1 w-10 rounded-full" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-brand-text-primary mb-1 text-lg font-semibold">
            <Link
              href={`/news/${article.slug}`}
              className="hover:text-brand-primary/80 transition-colors duration-150"
            >
              {article.title}
            </Link>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-content-article/15 text-brand-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
            </span>
            <StatusBadge variant={statusVariant[article.status]} />
          </div>
        </div>
      </div>

      {article.excerpt && (
        <p className="text-brand-text-secondary mb-4 line-clamp-3 text-sm leading-relaxed">
          {article.excerpt}
        </p>
      )}

      <div className="border-brand-secondary/10 text-brand-text-muted flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
        {byline && <span className="text-brand-text-secondary font-medium">By {byline}</span>}
        {byline && article.published_at && <span aria-hidden="true">·</span>}
        {article.published_at && (
          <span>
            Published {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
          </span>
        )}
        {!article.published_at && (
          <span>
            Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </article>
  );
}
