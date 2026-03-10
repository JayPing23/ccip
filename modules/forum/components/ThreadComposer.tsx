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
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
    >
      <h2 className="text-lg font-semibold text-gray-900">New Thread</h2>

      <div>
        <label htmlFor="thread-title" className="mb-1 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="thread-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Thread title"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="thread-body" className="mb-1 block text-sm font-medium text-gray-700">
          Body
        </label>
        <textarea
          id="thread-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Write your discussion topic…"
          disabled={loading}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Posting…' : 'Create Thread'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/forum/${categorySlug}`)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
