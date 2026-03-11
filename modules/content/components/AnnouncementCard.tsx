'use client';

import StatusBadge from '@/shared/components/StatusBadge';
import type { IContent } from '@/shared/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface AnnouncementCardProps {
  content: IContent;
  organizationName?: string;
  className?: string;
}

const priorityTags = new Set(['emergency', 'deadline']);

export default function AnnouncementCard({
  content,
  organizationName,
  className,
}: AnnouncementCardProps) {
  const isPriority = content.tags?.some((tag) => priorityTags.has(tag));

  const statusVariant = {
    DRAFT: 'draft' as const,
    SCHEDULED: 'draft' as const,
    PUBLISHED: 'published' as const,
    ARCHIVED: 'archived' as const,
  };

  return (
    <article
      className={`bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md ${className ?? ''}`}
    >
      {/* Content-type color marker */}
      <div className="bg-content-announcement mb-4 h-1 w-10 rounded-full" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-brand-text-primary mb-1 truncate text-lg font-semibold">
            <Link
              href={`/content/${content.slug}`}
              className="hover:text-brand-primary/80 transition-colors duration-150"
            >
              {content.title}
            </Link>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={statusVariant[content.status]} />
            {isPriority && (
              <span className="bg-status-error/15 text-status-error border-status-error/30 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                Priority
              </span>
            )}
            {organizationName && (
              <span className="bg-brand-primary/10 text-brand-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                {organizationName}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-brand-text-secondary mb-4 line-clamp-3 text-sm leading-relaxed">
        {content.body}
      </p>

      {content.tags && content.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="bg-brand-secondary/10 text-brand-text-secondary rounded-full px-2 py-0.5 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-brand-secondary/10 text-brand-text-muted border-t pt-3 text-xs">
        {content.published_at ? (
          <span>
            Published {formatDistanceToNow(new Date(content.published_at), { addSuffix: true })}
          </span>
        ) : (
          <span>
            Created {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </article>
  );
}
