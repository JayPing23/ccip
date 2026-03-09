'use client';

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

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
      alert('Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

  const visibilityLabels = {
    PUBLIC: 'Public',
    ORG_ONLY: 'Organization',
    DEPT_ONLY: 'Department',
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 hover:text-blue-600">
            <Link href={`/content/${content.slug}`}>{content.title}</Link>
          </h2>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusColors[content.status]}`}
            >
              {content.status}
            </span>
            <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
              {visibilityLabels[content.visibility]}
            </span>
          </div>
        </div>

        {/* Edit/Delete Actions */}
        {canEdit && (
          <div className="ml-4 flex gap-2">
            <Link
              href={`/content/${content.slug}/edit`}
              className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <p className="mb-4 line-clamp-3 whitespace-pre-wrap text-gray-700">{content.body}</p>

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
        <span>Posted {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</span>
        {content.updated_at && content.updated_at !== content.created_at && (
          <span>
            {' '}
            • Updated {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </article>
  );
}
