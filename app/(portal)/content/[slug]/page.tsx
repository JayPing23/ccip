'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import type { IContent } from '@/shared/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ContentDetailPageProps {
  params: {
    slug: string;
  };
}

/**
 * Content Detail Page
 * Shows a single announcement in full view
 */
export default function ContentDetailPage({ params }: ContentDetailPageProps) {
  const router = useRouter();
  const [content, setContent] = useState<IContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, fetch current user to check permissions
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();

        // Fetch the content
        const contentRes = await fetch(`/api/content?slug=${params.slug}`);
        if (!contentRes.ok) {
          throw new Error('Content not found');
        }

        const contentData = await contentRes.json();
        const item = contentData.data[0];

        if (!item) {
          throw new Error('Content not found');
        }

        setContent(item);

        // Check if user can edit
        if (userData.data?.id === item.created_by) {
          setCanEdit(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
            <LogoutButton />
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-red-50 p-6 text-red-800">
            <p className="text-lg font-medium">{error || 'Announcement not found'}</p>
            <button
              onClick={() => router.push('/feed')}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← Back to Feed
            </button>
          </div>
        </div>
      </main>
    );
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800',
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <button onClick={() => router.push('/feed')} className="mb-6 text-blue-600 hover:underline">
          ← Back to Feed
        </button>

        {/* Article */}
        <article className="rounded-lg bg-white p-8 shadow">
          {/* Header */}
          <div className="mb-6 border-b border-gray-200 pb-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-4 text-4xl font-bold text-gray-900">{content.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-block rounded px-3 py-1 text-sm font-medium ${statusColors[content.status]}`}
                  >
                    {content.status}
                  </span>
                  <span className="inline-block rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {content.visibility}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              {canEdit && (
                <Link
                  href={`/content/${content.id}/edit`}
                  className="ml-4 rounded bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                >
                  Edit
                </Link>
              )}
            </div>

            {/* Meta */}
            <div className="text-sm text-gray-600">
              <p>Posted {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</p>
              {content.updated_at && content.updated_at !== content.created_at && (
                <p>
                  Updated {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="whitespace-pre-wrap text-gray-800">{content.description}</p>
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
