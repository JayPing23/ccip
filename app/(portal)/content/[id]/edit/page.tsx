'use client';

import { IContent } from '@/shared/types/database.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const editContentSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  body: z.string().min(10, 'Content must be at least 10 characters'),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  visibility: z.enum(['PUBLIC', 'ORG_ONLY', 'DEPT_ONLY']),
  scheduled_at: z.string().optional(),
});

type EditContentFormData = z.infer<typeof editContentSchema>;

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<IContent | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditContentFormData>({
    resolver: zodResolver(editContentSchema),
  });

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      setContent(data.data);
      reset({
        title: data.data.title,
        body: data.data.body,
        status: data.data.status,
        visibility: data.data.visibility,
        scheduled_at: data.data.scheduled_at || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: EditContentFormData) => {
    if (!content) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update content');
      }

      router.push('/admin/content?success=Content updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Loading content...</div>;
  }

  if (!content) {
    return <div className="py-12 text-center text-red-600">Content not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Edit Content</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-lg bg-white p-8 shadow"
        >
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Title *</label>
            <input
              {...register('title')}
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Announcement title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Content *</label>
            <textarea
              {...register('body')}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Write your announcement content here (supports HTML)"
            />
            {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status *</label>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Visibility *</label>
              <select
                {...register('visibility')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="ORG_ONLY">Organization Only</option>
                <option value="DEPT_ONLY">Department Only</option>
              </select>
              {errors.visibility && (
                <p className="mt-1 text-sm text-red-600">{errors.visibility.message}</p>
              )}
            </div>
          </div>

          {/* Scheduled At */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Schedule For (Optional)
            </label>
            <input
              {...register('scheduled_at')}
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-600">Leave empty to publish immediately</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg bg-gray-300 px-6 py-2 font-medium text-gray-900 transition hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
