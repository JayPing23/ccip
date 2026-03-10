'use client';

import ForumCategoryList from '@/modules/forum/components/ForumCategoryList';
import { useForumCategories } from '@/modules/forum/hooks/useForumThread';
import Header from '@/shared/components/Header';
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
  const { user, loading } = useCurrentUser();
  const { categories, loading: catsLoading, error: catsError } = useForumCategories();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} navLinks={FORUM_NAV} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Forum</h1>
        <ForumCategoryList categories={categories} loading={catsLoading} error={catsError} />
      </main>
    </div>
  );
}
