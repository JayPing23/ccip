'use client';

import { ThreadList } from '@/modules/forum/components/ThreadView';
import { useForumCategories, useForumThreads } from '@/modules/forum/hooks/useForumThread';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const FORUM_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forum', label: 'Forum' },
  { href: '/feed', label: 'Announcements' },
  { href: '/news', label: 'Campus News' },
];

export default function ForumCategoryPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;

  const { user, loading: userLoading } = useCurrentUser();
  const { categories, loading: catsLoading } = useForumCategories();

  const category = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug]
  );

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    threads,
    total,
    loading: threadsLoading,
    error: threadsError,
  } = useForumThreads({ categoryId: category?.id ?? null, page, pageSize });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/forum" className="hover:text-blue-600">
            Forum
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900">{category?.name ?? categorySlug}</span>
        </nav>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category?.name ?? 'Category'}</h1>
            {category?.description && (
              <p className="mt-1 text-sm text-gray-500">{category.description}</p>
            )}
          </div>
          <Link
            href={`/forum/${categorySlug}/new`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            New Thread
          </Link>
        </div>

        <ThreadList threads={threads} loading={threadsLoading} error={threadsError} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
