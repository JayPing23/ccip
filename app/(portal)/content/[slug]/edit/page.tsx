'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import { IContent, IUser } from '@/shared/types/database.types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [content, setContent] = useState<IContent | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY',
    tags: '',
  });

  // Fetch current user and content on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.data);

        // Fetch content by slug
        const contentRes = await fetch(`/api/content?slug=${slug}`);
        if (!contentRes.ok) {
          setError('Content not found');
          setIsLoading(false);
          return;
        }
        const contentData = await contentRes.json();

        // Handle array response
        const content = Array.isArray(contentData.data) ? contentData.data[0] : contentData.data;

        if (!content) {
          setError('Content not found');
          setIsLoading(false);
          return;
        }

        setContent(content);

        // Check ownership
        if (content.created_by !== userData.data.id) {
          setError('You do not have permission to edit this content');
          setIsLoading(false);
          return;
        }

        // Pre-populate form
        setFormData({
          title: content.title,
          description: content.description,
          visibility: content.visibility,
          tags: content.tags?.join(', ') || '',
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setIsSubmitting(false);
      return;
    }

    // Parse tags
    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const response = await fetch(`/api/content/${content?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          visibility: formData.visibility,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update content');
      }

      // Redirect to content detail page
      const updatedContent = await response.json();
      router.push(`/content/${updatedContent.data.slug}`);
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-800">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Announcement</h1>
          </div>
          {user && <LogoutButton />}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="rounded-lg bg-white shadow">
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Announcement title"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Announcement details"
                rows={6}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Visibility Field */}
            <div>
              <label htmlFor="visibility" className="mb-2 block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="PUBLIC">Public (Anyone can see)</option>
                <option value="ORG_ONLY">Organization Only</option>
                <option value="DEPT_ONLY">Department Only</option>
              </select>
            </div>

            {/* Tags Field */}
            <div>
              <label htmlFor="tags" className="mb-2 block text-sm font-medium text-gray-700">
                Tags (comma-separated, optional)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. event, urgent, announcement"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="mt-1 text-sm text-gray-500">Separate multiple tags with commas</p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 border-t pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Updating...' : 'Update Announcement'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Current Status Info */}
        {content && (
          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Current Status:</strong> {content.status} |
              <strong className="ml-2">Last Updated:</strong>{' '}
              {new Date(content.updated_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
