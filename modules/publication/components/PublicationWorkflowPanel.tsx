'use client';

import type { ArticleStatus } from '@/modules/publication/constants';
import { ARTICLE_STATUS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
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
    <div className="border-brand-secondary/20 bg-brand-surface rounded-lg border p-6 shadow-sm">
      <h3 className="text-brand-text-primary mb-4 text-lg font-semibold">Workflow</h3>

      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-1">
        {statusSteps.map((step, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div
                className={`h-2 w-full rounded-full ${
                  isPast
                    ? 'bg-status-success'
                    : isActive
                      ? 'bg-brand-accent'
                      : 'bg-brand-secondary/20'
                }`}
              />
              <span className="text-brand-text-secondary mt-1 text-xs">{step.label}</span>
            </div>
          );
        })}
      </div>

      {article.status === ARTICLE_STATUS.ARCHIVED && (
        <p className="text-status-error mb-4 text-sm font-medium">This article is archived.</p>
      )}

      {/* Reviewer note */}
      {article.review_note && (
        <div className="border-status-warning/20 bg-status-warning/10 mb-4 rounded-lg border p-3">
          <p className="text-status-warning text-sm">
            <span className="font-semibold">Review note:</span> {article.review_note}
          </p>
        </div>
      )}

      {error && (
        <div className="border-status-error/20 bg-status-error/10 mb-4 rounded-lg border p-3">
          <p className="text-status-error text-sm">{error}</p>
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
            className="border-brand-secondary/30 focus:ring-brand-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="bg-status-success hover:bg-status-success/80 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={handleRequestRevision}
              disabled={loading}
              className="bg-status-warning hover:bg-status-warning/80 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
              className="bg-brand-primary hover:bg-brand-primary/80 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {article.status !== ARTICLE_STATUS.ARCHIVED && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="bg-status-error hover:bg-status-error/80 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
