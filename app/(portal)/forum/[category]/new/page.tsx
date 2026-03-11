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
        <p className="text-brand-text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header user={user} navLinks={FORUM_NAV} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-4 text-sm text-brand-text-muted">
          <Link href="/forum" className="hover:text-brand-primary">
            Forum
          </Link>
          <span className="mx-1">/</span>
          <Link href={`/forum/${categorySlug}`} className="hover:text-brand-primary">
            {category?.name ?? categorySlug}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-brand-text-primary">New Thread</span>
        </nav>

        {category ? (
          <ThreadComposer categoryId={category.id} categorySlug={categorySlug} />
        ) : (
          <div className="rounded-lg border border-status-error/20 bg-status-error/10 p-4 text-sm text-status-error">
            Category not found.
          </div>
        )}
      </main>
    </div>
  );
}
