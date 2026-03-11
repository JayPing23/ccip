'use client';

import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { IContent } from '@/shared/types/database.types';
import { canEditAnyContent, canEditOwnContent } from '@/shared/utils/permissions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface ContentDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Content Detail Page
 * Shows a single announcement in full view
 */
export default function ContentDetailPage({ params }: ContentDetailPageProps) {
  const { slug } = use(params);
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
        const contentRes = await fetch(`/api/content?slug=${encodeURIComponent(slug)}`);
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
  }, [slug]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-brand-secondary border-t-brand-primary h-12 w-12 animate-spin rounded-full border-4"></div>
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
      <main className="bg-brand-bg min-h-screen">
        <Header user={user} actions={actions} />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="bg-status-error/10 text-status-error rounded-lg p-6">
            <p className="text-lg font-medium">{error || 'Announcement not found'}</p>
            <button
              onClick={() => router.push('/feed')}
              className="text-brand-primary mt-4 hover:underline"
            >
              ← Back to Feed
            </button>
          </div>
        </div>
      </main>
    );
  }

  const statusColors = {
    DRAFT: 'bg-brand-secondary/10 text-brand-text-primary',
    SCHEDULED: 'bg-brand-accent/15 text-brand-primary',
    PUBLISHED: 'bg-status-success/15 text-status-success',
    ARCHIVED: 'bg-status-error/15 text-status-error',
  };

  return (
    <main className="bg-brand-bg min-h-screen">
      <Header user={user} actions={actions} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => router.push('/feed')}
          className="text-brand-primary mb-6 hover:underline"
        >
          ← Back to Feed
        </button>

        <article className="bg-brand-surface rounded-lg p-8 shadow">
          <div className="border-brand-secondary/20 mb-6 border-b pb-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-brand-text-primary mb-4 text-4xl font-bold">{content.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-block rounded px-3 py-1 text-sm font-medium ${statusColors[content.status]}`}
                  >
                    {content.status}
                  </span>
                  <span className="bg-brand-secondary/10 text-brand-text-secondary inline-block rounded px-3 py-1 text-sm font-medium">
                    {content.visibility}
                  </span>
                </div>
              </div>

              {canEdit && (
                <Link
                  href={`/content/${content.slug}/edit`}
                  className="bg-brand-primary hover:bg-brand-primary/80 ml-4 rounded px-4 py-2 font-medium text-white transition"
                >
                  Edit
                </Link>
              )}
            </div>

            <div className="text-brand-text-secondary text-sm">
              <p>Posted {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</p>
              {content.updated_at && content.updated_at !== content.created_at && (
                <p>
                  Updated {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-brand-text-primary whitespace-pre-wrap">{content.body}</p>
          </div>

          {content.tags && content.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-brand-accent/15 text-brand-primary inline-block rounded-full px-3 py-1 text-sm"
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
