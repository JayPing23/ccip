'use client';

import ForumCategoryList from '@/modules/forum/components/ForumCategoryList';
import { useForumCategories } from '@/modules/forum/hooks/useForumThread';
import Header from '@/shared/components/Header';
import MobileBottomNav from '@/shared/components/MobileBottomNav';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const FORUM_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forum', label: 'Forum' },
  { href: '/feed', label: 'Announcements' },
  { href: '/news', label: 'Campus News' },
];

export default function ForumPage() {
  const router = useRouter();
  const { user, loading, canAccessAdminConsole } = useCurrentUser();
  const { categories, loading: catsLoading, error: catsError } = useForumCategories();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brand-text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const actions = [] as Array<{ href: string; label: string; tone?: 'primary' | 'neutral' }>;
  if (canAccessAdminConsole) {
    actions.push({ href: '/admin/dashboard', label: 'Admin Console' });
  }

  return (
    <div className="bg-brand-bg min-h-screen pb-20 md:pb-0">
      <Header user={user} navLinks={FORUM_NAV} actions={actions} />
      <MobileBottomNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-brand-text-primary mb-6 text-2xl font-bold">Forum</h1>
        <ForumCategoryList categories={categories} loading={catsLoading} error={catsError} />
      </main>
    </div>
  );
}
