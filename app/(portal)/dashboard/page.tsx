'use client';

import RecentAnnouncements from '@/modules/content/components/RecentAnnouncements';
import { useContent } from '@/modules/content/hooks/useContent';
import NotificationPreferences from '@/modules/notifications/components/NotificationPreferences';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { IOrganization } from '@/shared/types/database.types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Dashboard Page (Portal Home)
 * Protected route - discoverable home surface for campus announcements
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

  const {
    content: recentItems,
    loading: contentLoading,
    error: contentError,
  } = useContent({ status: 'PUBLISHED', visibility: 'PUBLIC', limit: 5 });

  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    async function fetchOrgs() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) return;
        const json = await response.json();
        setOrganizations(json.data ?? []);
      } finally {
        setOrgsLoading(false);
      }
    }

    void fetchOrgs();
  }, [user]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchInput.trim();
      router.push(q ? `/feed?q=${encodeURIComponent(q)}` : '/feed');
    },
    [searchInput, router]
  );

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
        {/* Hero / welcome section with quick search */}
        <section className="mb-10 rounded-xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
            Welcome back, {user.display_name}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Campus Announcements</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Stay up to date with the latest official campus notices. Search or browse the full feed
            to find what you need.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input
              type="search"
              placeholder="Search announcements…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Quick search announcements"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>

        {/* Quick links */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/feed"
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-sm font-semibold text-gray-900">Browse All Announcements</h3>
            <p className="mt-1 text-sm text-gray-500">
              View the full feed with search and filter controls.
            </p>
          </Link>

          {canCreateAnnouncements && (
            <Link
              href="/content/create"
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-gray-900">Create Announcement</h3>
              <p className="mt-1 text-sm text-gray-500">Draft and publish a new campus notice.</p>
            </Link>
          )}

          {canManageAnnouncements && (
            <Link
              href="/content/manage"
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-gray-900">Manage Announcements</h3>
              <p className="mt-1 text-sm text-gray-500">
                Edit, schedule, or archive existing notices.
              </p>
            </Link>
          )}
        </section>

        {/* Recent announcements */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
            <Link href="/feed" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all &rarr;
            </Link>
          </div>
          <RecentAnnouncements items={recentItems} loading={contentLoading} error={contentError} />
        </section>

        {/* Notification preferences */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Notification Preferences</h2>
          <p className="mb-4 text-sm text-gray-600">
            Choose how you want to be notified for each organization.
          </p>
          <NotificationPreferences organizations={organizations} orgsLoading={orgsLoading} />
        </section>
      </main>
    </div>
  );
}
