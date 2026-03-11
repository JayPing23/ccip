'use client';

import ArticleFeed from '@/modules/publication/components/ArticleFeed';
import Header from '@/shared/components/Header';
import MobileBottomNav from '@/shared/components/MobileBottomNav';
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
        <div className="border-brand-accent border-t-brand-primary h-12 w-12 animate-spin rounded-full border-4" />
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
    <div className="bg-brand-bg min-h-screen pb-20 md:pb-0">
      <Header user={user} navLinks={navLinks} actions={actions} />
      <MobileBottomNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="bg-brand-surface border-brand-secondary/20 mb-8 rounded-xl border p-8 shadow-sm">
          <h1 className="text-brand-text-primary text-3xl font-bold">Campus News</h1>
          <p className="text-brand-text-secondary mt-2">
            Stories, features, and opinion pieces from the campus community.
          </p>
        </section>

        <section className="bg-brand-surface border-brand-secondary/20 rounded-xl border p-6 shadow-sm">
          <ArticleFeed layout="magazine" />
        </section>
      </main>
    </div>
  );
}
