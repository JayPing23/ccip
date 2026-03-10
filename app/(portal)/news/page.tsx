'use client';

import ArticleFeed from '@/modules/publication/components/ArticleFeed';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { canCreateArticle } from '@/shared/utils/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Campus News Listing Page
 * Public-facing feed of published articles.
 */
export default function NewsPage() {
  const router = useRouter();
  const { user, loading, canManageAnnouncements, canAccessAdminConsole } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const actions = [] as Array<{ href: string; label: string; tone?: 'primary' | 'neutral' }>;
  const userCanCreate = user.role_name ? canCreateArticle(user.role_name) : false;

  if (userCanCreate) {
    actions.push({ href: '/news/create', label: 'Write Article', tone: 'primary' });
  }

  if (canManageAnnouncements) {
    actions.push({ href: '/content/manage', label: 'Manage Announcements' });
  }

  if (canAccessAdminConsole) {
    actions.push({ href: '/admin/dashboard', label: 'Admin Console' });
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/feed', label: 'Announcements' },
    { href: '/news', label: 'Campus News' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} navLinks={navLinks} actions={actions} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-8 rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Campus News</h1>
          <p className="mt-2 text-gray-600">
            Stories, features, and opinion pieces from the campus community.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <ArticleFeed />
        </section>
      </main>
    </div>
  );
}
