'use client';

import type { IContent } from '@/shared/types/database.types';
import { formatDate } from '@/shared/utils/date-helpers';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function AdminContentPage() {
  const [contents, setContents] = useState<IContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = '/api/content/admin';
      const params = new URLSearchParams();

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (visibilityFilter !== 'ALL') {
        params.append('visibility', visibilityFilter);
      }

      if (params.toString()) {
        query += `?${params.toString()}`;
      }

      const response = await fetch(query);
      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      setContents(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, visibilityFilter]);

  useEffect(() => {
    void fetchContents();
  }, [fetchContents]);

  const handlePublish = async (contentId: string) => {
    try {
      const response = await fetch(`/api/content/${contentId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish');

      setContents((currentContents) =>
        currentContents.map((c) =>
          c.id === contentId
            ? { ...c, status: 'PUBLISHED', published_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure? This will be soft-deleted and can be restored.')) return;

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setContents((currentContents) => currentContents.filter((c) => c.id !== contentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Content</h1>
          <Link
            href="/content/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label htmlFor="status-filter" className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="visibility-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Visibility
            </label>
            <select
              id="visibility-filter"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All Visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="ORG_ONLY">Org Only</option>
              <option value="DEPT_ONLY">Dept Only</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-gray-600">Loading content...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : contents.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="mb-4 text-gray-600">No content found</p>
            <Link href="/content/create" className="text-blue-600 hover:underline">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div
                key={content.id}
                className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{content.title}</h3>
                    <p className="mb-3 text-sm text-gray-600">
                      {content.body?.slice(0, 100)}
                      {content.body && content.body.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(content.status)}`}
                      >
                        {content.status}
                      </span>
                      <span className="text-sm text-gray-500">{content.visibility}</span>
                      {content.scheduled_at && (
                        <span className="text-sm text-gray-500">
                          Scheduled: {formatDate(content.scheduled_at)}
                        </span>
                      )}
                      <span className="ml-auto text-sm text-gray-500">
                        {formatDate(content.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/content/${content.id}/edit`}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    {content.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(content.id)}
                        className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/content/${content.id}`}
                      className="rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
