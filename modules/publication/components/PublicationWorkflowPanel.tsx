'use client';

import type { IArticle } from '@/modules/publication/types';
import type { ArticleStatus } from '@/modules/publication/constants';
import { ARTICLE_STATUS } from '@/modules/publication/constants';
import { useCallback, useState } from 'react';

interface PublicationWorkflowPanelProps {
  article: IArticle;
  canReview: boolean;
  canPublish: boolean;
  onUpdate: (updated: IArticle) => void;
}

/**
 * Editorial Workflow Panel
 * Displays the current article status and provides workflow action buttons
 * for reviewers (approve / request revision) and publishers (publish / archive).
 */
export default function PublicationWorkflowPanel({
  article,
  canReview,
  canPublish,
  onUpdate,
}: PublicationWorkflowPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const perform = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message ?? 'Action failed');
        }
        onUpdate(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setLoading(false);
      }
    },
    [onUpdate]
  );

  const handleApprove = () =>
    perform(`/api/publication/${article.id}/review`, {
      action: 'approve',
      review_note: reviewNote || undefined,
    });

  const handleRequestRevision = () => {
    if (!reviewNote.trim()) {
      setError('A review note is required when requesting a revision');
      return;
    }
    perform(`/api/publication/${article.id}/review`, {
      action: 'request_revision',
      review_note: reviewNote,
    });
  };

  const handlePublish = () =>
    perform(`/api/publication/${article.id}/publish`, { action: 'publish' });

  const handleArchive = () =>
    perform(`/api/publication/${article.id}/publish`, { action: 'archive' });

  const statusSteps: { key: ArticleStatus; label: string }[] = [
    { key: ARTICLE_STATUS.DRAFT, label: 'Draft' },
    { key: ARTICLE_STATUS.IN_REVIEW, label: 'In Review' },
    { key: ARTICLE_STATUS.APPROVED, label: 'Approved' },
    { key: ARTICLE_STATUS.PUBLISHED, label: 'Published' },
  ];

  const currentIndex = statusSteps.findIndex((s) => s.key === article.status);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Workflow</h3>

      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-1">
        {statusSteps.map((step, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div
                className={`h-2 w-full rounded-full ${
                  isPast ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
              <span className="mt-1 text-xs text-gray-600">{step.label}</span>
            </div>
          );
        })}
      </div>

      {article.status === ARTICLE_STATUS.ARCHIVED && (
        <p className="mb-4 text-sm font-medium text-red-600">This article is archived.</p>
      )}

      {/* Reviewer note */}
      {article.review_note && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Review note:</span> {article.review_note}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Review actions */}
      {canReview && article.status === ARTICLE_STATUS.IN_REVIEW && (
        <div className="mb-4 space-y-3">
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Add a review note (required for revision requests)..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={handleRequestRevision}
              disabled={loading}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Request Revision
            </button>
          </div>
        </div>
      )}

      {/* Publish / archive actions */}
      {canPublish && (
        <div className="flex gap-2">
          {article.status === ARTICLE_STATUS.APPROVED && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {article.status !== ARTICLE_STATUS.ARCHIVED && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
