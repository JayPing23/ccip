'use client';

import ThreadComposer from '@/modules/forum/components/ThreadComposer';
import { useForumCategories } from '@/modules/forum/hooks/useForumThread';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

const FORUM_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forum', label: 'Forum' },
  { href: '/feed', label: 'Announcements' },
  { href: '/news', label: 'Campus News' },
];

export default function NewThreadPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;

  const { user, loading: userLoading } = useCurrentUser();
  const { categories, loading: catsLoading } = useForumCategories();

  const category = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug]
  );

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [userLoading, router, user]);

  if (userLoading || catsLoading) {
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
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/forum" className="hover:text-blue-600">
            Forum
          </Link>
          <span className="mx-1">/</span>
          <Link href={`/forum/${categorySlug}`} className="hover:text-blue-600">
            {category?.name ?? categorySlug}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900">New Thread</span>
        </nav>

        {category ? (
          <ThreadComposer categoryId={category.id} categorySlug={categorySlug} />
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Category not found.
          </div>
        )}
      </main>
    </div>
  );
}
