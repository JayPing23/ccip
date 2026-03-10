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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        placeholder="Write a reply…"
        disabled={loading}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Posting…' : 'Reply'}
      </button>
    </form>
  );
}
