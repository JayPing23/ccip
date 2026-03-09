'use client';

import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { IContent } from '@/shared/types/database.types';
import { canEditAnyContent, canEditOwnContent } from '@/shared/utils/permissions';
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
  const {
    user,
    loading: userLoading,
    canCreateAnnouncements,
    canManageAnnouncements,
    canAccessAdminConsole,
  } = useCurrentUser();
  const [content, setContent] = useState<IContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the content
        const contentRes = await fetch(`/api/content?slug=${params.slug}`);
        if (!contentRes.ok) {
          throw new Error('Content not found');
        }

        const contentData = await contentRes.json();
        const item = contentData.data;

        if (!item) {
          throw new Error('Content not found');
        }

        setContent(item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    void fetchContent();
  }, [params.slug]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const actions = [] as Array<{ href: string; label: string; tone?: 'primary' | 'neutral' }>;

  if (canCreateAnnouncements) {
    actions.push({ href: '/content/create', label: 'New Announcement', tone: 'primary' });
  }

  if (canManageAnnouncements) {
    actions.push({ href: '/content/manage', label: 'Manage Announcements' });
  }

  if (canAccessAdminConsole) {
    actions.push({ href: '/admin/dashboard', label: 'Admin Console' });
  }

  const canEdit =
    content?.author_id && user.role_name
      ? content.author_id === user.id
        ? canEditOwnContent(user.role_name)
        : canEditAnyContent(user.role_name)
      : false;

  if (error || !content) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header user={user} actions={actions} />
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
      <Header user={user} actions={actions} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => router.push('/feed')} className="mb-6 text-blue-600 hover:underline">
          ← Back to Feed
        </button>

        <article className="rounded-lg bg-white p-8 shadow">
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

              {canEdit && (
                <Link
                  href={`/content/${content.slug}/edit`}
                  className="ml-4 rounded bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                >
                  Edit
                </Link>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p>Posted {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</p>
              {content.updated_at && content.updated_at !== content.created_at && (
                <p>
                  Updated {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="whitespace-pre-wrap text-gray-800">{content.body}</p>
          </div>

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
