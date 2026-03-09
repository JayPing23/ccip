'use client';

import ContentFeed from '@/modules/content/components/ContentFeed';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Dashboard Page (Portal Home)
 * Protected route - shows user info and content feed
 */
export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    loading,
    error,
    canCreateAnnouncements,
    canManageAnnouncements,
    canAccessAdminConsole,
  } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="mb-4 text-red-700">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Back to Login
          </button>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} actions={actions} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
            Official Announcements
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">Campus updates in one workspace</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            The dashboard stays focused on the current announcements foundation so publication and
            forum modules can be added later without overloading this surface.
          </p>
        </div>

        <ContentFeed visibility="PUBLIC" showFilters={false} />
      </main>
    </div>
  );
}
