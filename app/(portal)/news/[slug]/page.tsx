'use client';

import { ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { canEditAnyArticle, canEditOwnArticle } from '@/shared/utils/permissions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Article Detail Page
 * Displays a single published article in full view.
 */
export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [article, setArticle] = useState<IArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/publication?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Article not found');

        const json = await res.json();
        const item = json.data as IArticle | null;
        if (!item) throw new Error('Article not found');

        setArticle(item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    void fetchArticle();
  }, [slug]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/feed', label: 'Announcements' },
    { href: '/news', label: 'Campus News' },
  ];

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} navLinks={navLinks} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-red-50 p-8 text-center">
            <p className="mb-4 text-red-700">{error ?? 'Article not found'}</p>
            <Link
              href="/news"
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Back to News
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = article.author_id === user.id;
  const canEdit = isOwner
    ? user.role_name
      ? canEditOwnArticle(user.role_name)
      : false
    : user.role_name
      ? canEditAnyArticle(user.role_name)
      : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} navLinks={navLinks} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <article className="rounded-xl bg-white p-8 shadow-sm">
          {/* Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
            </span>
            {article.published_at && (
              <span className="text-sm text-gray-500">
                Published {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
              </span>
            )}
            {canEdit && (
              <Link
                href={`/news/${article.slug}/edit`}
                className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </Link>
            )}
          </div>

          <h1 className="mb-4 text-3xl leading-tight font-bold text-gray-900">{article.title}</h1>

          {article.excerpt && (
            <p className="mb-6 text-lg leading-relaxed text-gray-600">{article.excerpt}</p>
          )}

          {/* Body */}
          <div className="prose prose-lg max-w-none whitespace-pre-wrap text-gray-800">
            {article.body}
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <Link href="/news" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              &larr; Back to Campus News
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
