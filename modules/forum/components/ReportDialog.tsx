'use client';

import { useReportContent } from '@/modules/forum/hooks/useForumThread';
import type { ReportReason } from '@/modules/moderation/constants';
import { REPORT_REASON, REPORT_REASON_LABELS } from '@/modules/moderation/constants';
import { useToast } from '@/shared/components/Toast';
import { useCallback, useState } from 'react';

interface ReportDialogProps {
  threadId: string;
  replyId?: string | null;
  onClose: () => void;
}

export default function ReportDialog({ threadId, replyId, onClose }: ReportDialogProps) {
  const { showToast } = useToast();
  const { reportContent, loading, error } = useReportContent();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reason) {
        showToast('Please select a reason.', 'warning');
        return;
      }

      const ok = await reportContent(threadId, reason, description || undefined, replyId);
      if (ok) {
        showToast('Report submitted. Thank you.', 'success');
        onClose();
      }
    },
    [threadId, replyId, reason, description, reportContent, showToast, onClose]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface w-full max-w-md rounded-lg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-brand-text-primary mb-4 text-lg font-semibold">Report Content</h3>

        <label
          htmlFor="report-reason"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Reason
        </label>
        <select
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          className="border-brand-secondary/30 focus:border-brand-primary focus:ring-brand-primary mb-3 w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        >
          <option value="">Select a reason…</option>
          {Object.values(REPORT_REASON).map((r) => (
            <option key={r} value={r}>
              {REPORT_REASON_LABELS[r]}
            </option>
          ))}
        </select>

        <label
          htmlFor="report-desc"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Additional details (optional)
        </label>
        <textarea
          id="report-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-brand-secondary/30 focus:border-brand-primary focus:ring-brand-primary mb-3 w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          placeholder="Provide more context…"
        />

        {error && <p className="text-status-error mb-3 text-sm">{error}</p>}

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
            disabled={loading || !reason}
            className="bg-status-error hover:bg-status-error/80 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
