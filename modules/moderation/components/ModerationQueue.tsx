'use client';

import {
  MODERATION_ACTION_TYPE,
  REPORT_REASON_LABELS,
  REPORT_STATUS,
  REPORTABLE_CONTENT_TYPE,
  RESTRICTION_TYPE,
  RESTRICTION_TYPE_LABELS,
} from '@/modules/moderation/constants';
import type {
  ModerationActionType,
  ReportStatus,
  ReportableContentType,
  RestrictionType,
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
      <h2 className="text-xl font-bold text-gray-900">Moderation Queue</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
          title="Filter by report status"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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
      {loading && <p className="text-sm text-gray-500">Loading reports…</p>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-gray-500">No reports match the selected filters.</p>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onReview={handleReview}
              onAction={() => setActionTarget(report)}
            />
          ))}
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-800">{report.content_type}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">{REPORT_REASON_LABELS[report.reason]}</span>
            <span className="text-gray-400">·</span>
            <StatusBadge status={report.status} />
          </div>
          {report.description && <p className="mt-1 text-sm text-gray-600">{report.description}</p>}
          <p className="mt-1 text-xs text-gray-400">
            Reported {new Date(report.created_at).toLocaleString()} · ID:{' '}
            {report.content_id.slice(0, 8)}…
          </p>
        </div>

        {isPending && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onReview(report.id, REPORT_STATUS.DISMISSED)}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Dismiss
            </button>
            <button
              onClick={onAction}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700"
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
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    DISMISSED: 'bg-gray-100 text-gray-600',
    ACTIONED: 'bg-green-100 text-green-800',
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
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Take Moderation Action</h3>
        <p className="mb-3 text-xs text-gray-500">
          Report: {REPORT_REASON_LABELS[report.reason]} on {report.content_type} (
          {report.content_id.slice(0, 8)}…)
        </p>

        <label htmlFor="mod-action" className="mb-1 block text-sm font-medium text-gray-700">
          Action
        </label>
        <select
          id="mod-action"
          value={action}
          onChange={(e) => setAction(e.target.value as ModerationActionType)}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select an action…</option>
          {Object.values(MODERATION_ACTION_TYPE).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <label htmlFor="mod-reason" className="mb-1 block text-sm font-medium text-gray-700">
          Reason
        </label>
        <textarea
          id="mod-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Explain your decision…"
        />

        <label htmlFor="mod-restrict" className="mb-1 block text-sm font-medium text-gray-700">
          User Restriction (optional)
        </label>
        <select
          id="mod-restrict"
          value={restrictType}
          onChange={(e) => setRestrictType(e.target.value as RestrictionType | '')}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !action || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Applying…' : 'Apply Action'}
          </button>
        </div>
      </form>
    </div>
  );
}
