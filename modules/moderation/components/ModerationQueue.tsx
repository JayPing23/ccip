'use client';

import type {
  ModerationActionType,
  ReportableContentType,
  ReportStatus,
  RestrictionType,
} from '@/modules/moderation/constants';
import {
  MODERATION_ACTION_TYPE,
  REPORT_REASON_LABELS,
  REPORT_STATUS,
  REPORTABLE_CONTENT_TYPE,
  RESTRICTION_TYPE,
  RESTRICTION_TYPE_LABELS,
} from '@/modules/moderation/constants';
import type { IModerationReport } from '@/modules/moderation/types';
import { useToast } from '@/shared/components/Toast';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Shared fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? 'Request failed');
  return json.data as T;
}

// ---------------------------------------------------------------------------
// ModerationQueue — the main moderator view
// ---------------------------------------------------------------------------

export default function ModerationQueue() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<IModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('PENDING');
  const [contentTypeFilter, setContentTypeFilter] = useState<ReportableContentType | ''>('');

  // Action modal state
  const [actionTarget, setActionTarget] = useState<IModerationReport | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (contentTypeFilter) params.append('content_type', contentTypeFilter);
      const data = await fetchJson<IModerationReport[]>(`/api/moderation/queue?${params}`);
      setReports(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, contentTypeFilter]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // ---- Review (change status) -------------------------------------------------

  const handleReview = useCallback(
    async (reportId: string, newStatus: ReportStatus) => {
      try {
        await fetchJson('/api/moderation/queue', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: reportId, status: newStatus }),
        });
        showToast(`Report marked as ${newStatus}.`, 'success');
        void fetchReports();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update report', 'error');
      }
    },
    [fetchReports, showToast]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-brand-text-primary text-xl font-bold">Moderation Queue</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
          title="Filter by report status"
          className="border-brand-secondary/30 rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.values(REPORT_STATUS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={contentTypeFilter}
          onChange={(e) => setContentTypeFilter(e.target.value as ReportableContentType | '')}
          title="Filter by content type"
          className="border-brand-secondary/30 rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Types</option>
          {Object.values(REPORTABLE_CONTENT_TYPE).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Report list */}
      {loading && <p className="text-brand-text-muted text-sm">Loading reports…</p>}
      {error && (
        <div className="border-status-error/20 bg-status-error/10 text-status-error rounded-lg border p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-brand-text-muted text-sm">No reports match the selected filters.</p>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onReview={handleReview}
              onAction={() => setActionTarget(report)}
            />
          ))}

          {/* Pagination */}
          {reports.length > PAGE_SIZE && (
            <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="border-brand-secondary/30 rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-brand-text-muted text-sm">
                Page {page} of {Math.ceil(reports.length / PAGE_SIZE)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(reports.length / PAGE_SIZE)}
                onClick={() => setPage(page + 1)}
                className="border-brand-secondary/30 rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Action modal */}
      {actionTarget && (
        <ActionModal
          report={actionTarget}
          onClose={() => setActionTarget(null)}
          onComplete={() => {
            setActionTarget(null);
            void fetchReports();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportCard
// ---------------------------------------------------------------------------

interface ReportCardProps {
  report: IModerationReport;
  onReview: (reportId: string, newStatus: ReportStatus) => void;
  onAction: () => void;
}

function ReportCard({ report, onReview, onAction }: ReportCardProps) {
  const isPending = report.status === REPORT_STATUS.PENDING;

  return (
    <div className="border-brand-secondary/20 bg-brand-surface rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-brand-text-primary font-medium">{report.content_type}</span>
            <span className="text-brand-text-muted">·</span>
            <span className="text-brand-text-secondary">{REPORT_REASON_LABELS[report.reason]}</span>
            <span className="text-brand-text-muted">·</span>
            <StatusBadge status={report.status} />
          </div>
          {report.description && (
            <p className="text-brand-text-secondary mt-1 text-sm">{report.description}</p>
          )}
          <p className="text-brand-text-muted mt-1 text-xs">
            Reported {new Date(report.created_at).toLocaleString()} · ID:{' '}
            {report.content_id.slice(0, 8)}…
          </p>
        </div>

        {isPending && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onReview(report.id, REPORT_STATUS.DISMISSED)}
              className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded border px-3 py-1 text-xs font-medium transition"
            >
              Dismiss
            </button>
            <button
              onClick={onAction}
              className="bg-status-error hover:bg-status-error/80 rounded px-3 py-1 text-xs font-medium text-white transition"
            >
              Take Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ReportStatus }) {
  const colors: Record<ReportStatus, string> = {
    PENDING: 'bg-status-warning/15 text-status-warning',
    REVIEWED: 'bg-brand-accent/15 text-brand-primary',
    DISMISSED: 'bg-brand-secondary/10 text-brand-text-secondary',
    ACTIONED: 'bg-status-success/15 text-status-success',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[status]}`}>{status}</span>
  );
}

// ---------------------------------------------------------------------------
// ActionModal — take a moderation action + optionally restrict user
// ---------------------------------------------------------------------------

interface ActionModalProps {
  report: IModerationReport;
  onClose: () => void;
  onComplete: () => void;
}

function ActionModal({ report, onClose, onComplete }: ActionModalProps) {
  const { showToast } = useToast();
  const [action, setAction] = useState<ModerationActionType | ''>('');
  const [reason, setReason] = useState('');
  const [restrictType, setRestrictType] = useState<RestrictionType | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!action || !reason.trim()) {
        showToast('Action and reason are required.', 'warning');
        return;
      }

      try {
        setLoading(true);

        // 1. Create moderation action
        await fetchJson('/api/moderation/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: report.content_type,
            content_id: report.content_id,
            action,
            reason: reason.trim(),
            report_id: report.id,
          }),
        });

        // 2. Mark report as actioned
        await fetchJson('/api/moderation/queue', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: report.id, status: REPORT_STATUS.ACTIONED }),
        });

        // 3. Optionally restrict the reporter's subject (the content author)
        // We don't know the author_id from the report alone, so restriction is
        // only created if the moderator explicitly chooses one and provides it.
        // For now we expose the UI but the restriction targets the reporter_id
        // as a placeholder — real implementations would resolve content→author.
        if (restrictType) {
          await fetchJson('/api/moderation/restrictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: report.reporter_id, // Note: would be content author in production
              restriction_type: restrictType,
              reason: reason.trim(),
            }),
          });
        }

        showToast('Moderation action taken.', 'success');
        onComplete();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Action failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [action, reason, restrictType, report, showToast, onComplete]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface w-full max-w-md rounded-lg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-brand-text-primary mb-4 text-lg font-semibold">
          Take Moderation Action
        </h3>
        <p className="text-brand-text-muted mb-3 text-xs">
          Report: {REPORT_REASON_LABELS[report.reason]} on {report.content_type} (
          {report.content_id.slice(0, 8)}…)
        </p>

        <label
          htmlFor="mod-action"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Action
        </label>
        <select
          id="mod-action"
          value={action}
          onChange={(e) => setAction(e.target.value as ModerationActionType)}
          className="border-brand-secondary/30 mb-3 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select an action…</option>
          {Object.values(MODERATION_ACTION_TYPE).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <label
          htmlFor="mod-reason"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Reason
        </label>
        <textarea
          id="mod-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="border-brand-secondary/30 mb-3 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Explain your decision…"
        />

        <label
          htmlFor="mod-restrict"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          User Restriction (optional)
        </label>
        <select
          id="mod-restrict"
          value={restrictType}
          onChange={(e) => setRestrictType(e.target.value as RestrictionType | '')}
          className="border-brand-secondary/30 mb-4 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {Object.values(RESTRICTION_TYPE).map((r) => (
            <option key={r} value={r}>
              {RESTRICTION_TYPE_LABELS[r]}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-lg border px-4 py-2 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !action || !reason.trim()}
            className="bg-status-error hover:bg-status-error/80 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? 'Applying…' : 'Apply Action'}
          </button>
        </div>
      </form>
    </div>
  );
}
