'use client';

import { useCreateReply } from '@/modules/forum/hooks/useForumThread';
import { useToast } from '@/shared/components/Toast';
import { useCallback, useState } from 'react';

interface ReplyComposerProps {
  threadId: string;
  parentReplyId?: string | null;
  onReplyCreated?: () => void;
  /** When true the thread is locked and composing is blocked */
  disabled?: boolean;
}

export default function ReplyComposer({
  threadId,
  parentReplyId,
  onReplyCreated,
  disabled,
}: ReplyComposerProps) {
  const { showToast } = useToast();
  const { createReply, loading, error } = useCreateReply();
  const [body, setBody] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = body.trim();
      if (!trimmed) {
        showToast('Reply cannot be empty.', 'warning');
        return;
      }

      const reply = await createReply(threadId, trimmed, parentReplyId);
      if (reply) {
        setBody('');
        showToast('Reply posted!', 'success');
        onReplyCreated?.();
      }
    },
    [body, threadId, parentReplyId, createReply, showToast, onReplyCreated]
  );

  if (disabled) {
    return (
      <div className="rounded-lg border border-brand-secondary/20 bg-brand-bg p-4 text-center text-sm text-brand-text-muted">
        This thread is locked. Replies are not accepted.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-brand-secondary/30 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none"
        placeholder="Write a reply…"
        disabled={loading}
      />

      {error && <p className="text-sm text-status-error">{error}</p>}

      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary/80 disabled:opacity-50"
      >
        {loading ? 'Posting…' : 'Reply'}
      </button>
    </form>
  );
}
