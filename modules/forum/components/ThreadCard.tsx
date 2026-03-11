'use client';

import type { IForumThreadWithCategory } from '@/modules/forum/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ThreadCardProps {
  thread: IForumThreadWithCategory;
  className?: string;
}

export default function ThreadCard({ thread, className }: ThreadCardProps) {
  const categorySlug = thread.category?.slug ?? thread.category_id;
  const categoryName = thread.category?.name;

  return (
    <article
      className={`bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md ${className ?? ''}`}
    >
      {/* Content-type color marker */}
      <div className="bg-content-forum mb-4 h-1 w-10 rounded-full" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-brand-text-primary mb-1 text-lg font-semibold">
            <Link
              href={`/forum/${categorySlug}/${thread.slug}`}
              className="hover:text-brand-primary/80 transition-colors duration-150"
            >
              {thread.pinned && (
                <span className="text-brand-primary mr-1.5 text-xs font-bold uppercase">
                  Pinned
                </span>
              )}
              {thread.title}
            </Link>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="bg-content-forum/20 text-brand-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                {categoryName}
              </span>
            )}
            {thread.status !== 'OPEN' && (
              <span className="bg-brand-text-muted/15 text-brand-text-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                {thread.status.charAt(0) + thread.status.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-brand-text-secondary mb-4 line-clamp-2 text-sm leading-relaxed">
        {thread.body}
      </p>

      <div className="border-brand-secondary/10 text-brand-text-muted flex flex-wrap items-center gap-3 border-t pt-3 text-xs">
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
        </span>
        <span>Active {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}</span>
      </div>
    </article>
  );
}
