'use client';

import ConfirmDialog from '@/shared/components/ConfirmDialog';
import type { IContent } from '@/shared/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

interface ContentCardProps {
  content: IContent;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

/**
 * ContentCard Component
 * Displays a single piece of content in a card format
 */
export default function ContentCard({ content, onDelete, canEdit = false }: ContentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      onDelete?.(content.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  const statusColors = {
    DRAFT: 'bg-status-warning/15 text-status-warning',
    SCHEDULED: 'bg-brand-accent/20 text-brand-primary',
    PUBLISHED: 'bg-status-success/15 text-status-success',
    ARCHIVED: 'bg-brand-text-muted/15 text-brand-text-muted',
  };

  const visibilityLabels = {
    PUBLIC: 'Public',
    ORG_ONLY: 'Organization',
    DEPT_ONLY: 'Department',
  };

  return (
    <article
      data-testid="content-card"
      className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-brand-text-primary hover:text-brand-primary/80 mb-2 text-xl font-semibold">
            <Link href={`/content/${content.slug}`} data-testid="content-card-title">
              {content.title}
            </Link>
          </h2>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusColors[content.status]}`}
            >
              {content.status}
            </span>
            <span className="bg-brand-secondary/10 text-brand-text-secondary inline-block rounded px-2 py-1 text-xs font-medium">
              {visibilityLabels[content.visibility]}
            </span>
          </div>
        </div>

        {/* Edit/Delete Actions */}
        {canEdit && (
          <div className="ml-4 flex gap-2">
            <Link
              href={`/content/${content.slug}/edit`}
              className="bg-brand-primary hover:bg-brand-primary/90 rounded px-3 py-1 text-sm font-medium text-white transition"
            >
              Edit
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={isDeleting}
              className="bg-status-error hover:bg-status-error/90 rounded px-3 py-1 text-sm font-medium text-white transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <p className="text-brand-text-secondary mb-4 line-clamp-3 whitespace-pre-wrap">
        {content.body}
      </p>

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="bg-brand-secondary/10 text-brand-text-secondary inline-block rounded-full px-2 py-1 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-brand-secondary/10 text-brand-text-muted border-t pt-3 text-xs">
        <span>Posted {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</span>
        {content.updated_at && content.updated_at !== content.created_at && (
          <span>
            {' '}
            • Updated {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${content.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
