'use client';

import { useCreateThread } from '@/modules/forum/hooks/useForumThread';
import { useToast } from '@/shared/components/Toast';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface ThreadComposerProps {
  categoryId: string;
  categorySlug: string;
}

export default function ThreadComposer({ categoryId, categorySlug }: ThreadComposerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { createThread, loading, error } = useCreateThread();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedTitle = title.trim();
      const trimmedBody = body.trim();

      if (!trimmedTitle || !trimmedBody) {
        showToast('Title and body are required.', 'warning');
        return;
      }

      const thread = await createThread(categoryId, trimmedTitle, trimmedBody);
      if (thread) {
        showToast('Thread created!', 'success');
        router.push(`/forum/thread/${thread.slug}`);
      }
    },
    [categoryId, title, body, createThread, router, showToast]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="border-brand-secondary/20 bg-brand-surface space-y-4 rounded-lg border p-5"
    >
      <h2 className="text-brand-text-primary text-lg font-semibold">New Thread</h2>

      <div>
        <label
          htmlFor="thread-title"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Title
        </label>
        <input
          id="thread-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="border-brand-secondary/30 focus:border-brand-primary focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          placeholder="Thread title"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="thread-body"
          className="text-brand-text-secondary mb-1 block text-sm font-medium"
        >
          Body
        </label>
        <textarea
          id="thread-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="border-brand-secondary/30 focus:border-brand-primary focus:ring-brand-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          placeholder="Write your discussion topic…"
          disabled={loading}
        />
      </div>

      {error && <p className="text-status-error text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-primary/80 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
        >
          {loading ? 'Posting…' : 'Create Thread'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/forum/${categorySlug}`)}
          className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-lg border px-4 py-2 text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
