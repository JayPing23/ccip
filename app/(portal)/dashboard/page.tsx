'use client';

import RecentAnnouncements from '@/modules/content/components/RecentAnnouncements';
import { useContent } from '@/modules/content/hooks/useContent';
import RecentThreads from '@/modules/forum/components/RecentThreads';
import type { IForumThread } from '@/modules/forum/types';
import NotificationPreferences from '@/modules/notifications/components/NotificationPreferences';
import RecentArticles from '@/modules/publication/components/RecentArticles';
import type { IArticle } from '@/modules/publication/types';
import Header from '@/shared/components/Header';
import MobileBottomNav from '@/shared/components/MobileBottomNav';
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

  const [recentArticles, setRecentArticles] = useState<IArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [recentThreads, setRecentThreads] = useState<IForumThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;

    async function fetchArticles() {
      try {
        setArticlesLoading(true);
        setArticlesError(null);
        const res = await fetch('/api/publication?limit=5');
        if (!res.ok) throw new Error('Failed to load articles');
        const json = await res.json();
        setRecentArticles(json.data ?? []);
      } catch (err) {
        setArticlesError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setArticlesLoading(false);
      }
    }

    void fetchArticles();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchThreads() {
      try {
        setThreadsLoading(true);
        setThreadsError(null);
        const res = await fetch('/api/forum/threads?limit=5');
        if (!res.ok) throw new Error('Failed to load threads');
        const json = await res.json();
        setRecentThreads(json.data ?? []);
      } catch (err) {
        setThreadsError(err instanceof Error ? err.message : 'Failed to load threads');
      } finally {
        setThreadsLoading(false);
      }
    }

    void fetchThreads();
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
          <div className="border-brand-accent border-t-brand-primary mb-4 h-12 w-12 animate-spin rounded-full border-4"></div>
          <p className="text-brand-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-status-error/10 rounded-lg p-8 text-center">
          <p className="text-status-error mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-status-error hover:bg-status-error/90 rounded-lg px-4 py-2 text-white"
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
    <div className="bg-brand-bg min-h-screen pb-20 md:pb-0">
      <Header user={user} actions={actions} />
      <MobileBottomNav />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero / welcome section with quick search */}
        <section className="bg-brand-surface border-brand-secondary/20 mb-10 rounded-xl border p-8 shadow-sm">
          <p className="text-brand-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Welcome back, {user.display_name}
          </p>
          <h1 className="text-brand-text-primary mt-2 text-3xl font-bold">Campus Hub</h1>
          <p className="text-brand-text-secondary mt-2 max-w-2xl">
            Stay up to date with official announcements, campus news, and community discussions.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input
              type="search"
              placeholder="Search announcements, articles, discussions…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 min-w-0 flex-1 rounded-lg border px-4 py-2 text-sm focus:ring-1"
              aria-label="Quick search announcements"
            />
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 rounded-lg px-5 py-2 text-sm font-medium text-white"
            >
              Search
            </button>
          </form>
        </section>

        {/* Quick links */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/feed"
            className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-brand-text-primary text-sm font-semibold">
              Browse All Announcements
            </h3>
            <p className="text-brand-text-muted mt-1 text-sm">
              View the full feed with search and filter controls.
            </p>
          </Link>

          <Link
            href="/news"
            className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-brand-text-primary text-sm font-semibold">Campus News</h3>
            <p className="text-brand-text-muted mt-1 text-sm">
              Read student articles, features, and editorials.
            </p>
          </Link>

          <Link
            href="/forum"
            className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-brand-text-primary text-sm font-semibold">Community Forum</h3>
            <p className="text-brand-text-muted mt-1 text-sm">
              Join discussions and connect with the campus community.
            </p>
          </Link>

          {canCreateAnnouncements && (
            <Link
              href="/content/create"
              className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-brand-text-primary text-sm font-semibold">Create Announcement</h3>
              <p className="text-brand-text-muted mt-1 text-sm">
                Draft and publish a new campus notice.
              </p>
            </Link>
          )}

          {canManageAnnouncements && (
            <Link
              href="/content/manage"
              className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-brand-text-primary text-sm font-semibold">
                Manage Announcements
              </h3>
              <p className="text-brand-text-muted mt-1 text-sm">
                Edit, schedule, or archive existing notices.
              </p>
            </Link>
          )}
        </section>

        {/* Content pillars — stacked on mobile, 3-column grid on desktop (Design Plan Phase 6) */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent announcements */}
          <section className="bg-brand-surface border-brand-secondary/20 rounded-xl border p-6 shadow-sm">
            <div className="bg-content-announcement mb-4 h-1 w-10 rounded-full" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-brand-text-primary text-lg font-semibold">
                Recent Announcements
              </h2>
              <Link
                href="/feed"
                className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
              >
                View all &rarr;
              </Link>
            </div>
            <RecentAnnouncements
              items={recentItems}
              loading={contentLoading}
              error={contentError}
            />
          </section>

          {/* Latest campus news */}
          <section className="bg-brand-surface border-brand-secondary/20 rounded-xl border p-6 shadow-sm">
            <div className="bg-content-article mb-4 h-1 w-10 rounded-full" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-brand-text-primary text-lg font-semibold">Latest Campus News</h2>
              <Link
                href="/news"
                className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
              >
                View all &rarr;
              </Link>
            </div>
            <RecentArticles
              items={recentArticles}
              loading={articlesLoading}
              error={articlesError}
            />
          </section>

          {/* Recent forum discussions */}
          <section className="bg-brand-surface border-brand-secondary/20 rounded-xl border p-6 shadow-sm">
            <div className="bg-content-forum mb-4 h-1 w-10 rounded-full" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-brand-text-primary text-lg font-semibold">Recent Discussions</h2>
              <Link
                href="/forum"
                className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
              >
                View all &rarr;
              </Link>
            </div>
            <RecentThreads items={recentThreads} loading={threadsLoading} error={threadsError} />
          </section>
        </div>

        {/* Notification preferences */}
        <section className="bg-brand-surface border-brand-secondary/20 rounded-xl border p-6 shadow-sm">
          <h2 className="text-brand-text-primary mb-2 text-lg font-semibold">
            Notification Preferences
          </h2>
          <p className="text-brand-text-secondary mb-4 text-sm">
            Choose how you want to be notified for each organization.
          </p>
          <NotificationPreferences organizations={organizations} orgsLoading={orgsLoading} />
        </section>
      </main>
    </div>
  );
}
