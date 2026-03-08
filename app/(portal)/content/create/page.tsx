'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Create Content Page
 * Form to create a new announcement
 */
export default function CreateContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'PUBLIC' as const,
    tags: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          status: 'DRAFT',
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create announcement');
      }

      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back Button */}
        <button onClick={() => router.push('/feed')} className="mb-6 text-blue-600 hover:underline">
          ← Back to Feed
        </button>

        {/* Form */}
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Create Announcement</h2>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Announcement title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Announcement details"
              />
            </div>

            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="mb-2 block text-sm font-medium text-gray-700">
                Visibility *
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="PUBLIC">Public</option>
                <option value="ORG_ONLY">Organization Only</option>
                <option value="DEPT_ONLY">Department Only</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="mb-2 block text-sm font-medium text-gray-700">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                placeholder="e.g., general, events, deadline"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Draft'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/feed')}
                disabled={loading}
                className="flex-1 rounded-lg bg-gray-300 px-6 py-2 font-medium text-gray-900 transition hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
