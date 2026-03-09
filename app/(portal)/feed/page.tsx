'use client';

import ContentFeed from '@/modules/content/components/ContentFeed';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Feed Page (Portal Home)
 * Displays all published content in a feed format
 */
export default function FeedPage() {
  const router = useRouter();
  const { user, loading, canCreateAnnouncements, canManageAnnouncements, canAccessAdminConsole } =
    useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Header user={user} actions={actions} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
            Official Feed
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">Announcement feed</h2>
          <p className="mt-2 text-gray-600">
            Browse published campus notices in a dedicated announcement surface instead of mixing
            them with future publication or forum content.
          </p>
        </div>

        <ContentFeed visibility="PUBLIC" showFilters={true} />
      </div>
    </main>
  );
}
