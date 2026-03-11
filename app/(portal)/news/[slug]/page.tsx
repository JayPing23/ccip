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
        <div className="border-brand-secondary border-t-brand-primary h-12 w-12 animate-spin rounded-full border-4" />
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
      <div className="bg-brand-bg min-h-screen">
        <Header user={user} navLinks={navLinks} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="bg-status-error/10 rounded-lg p-8 text-center">
            <p className="text-status-error mb-4">{error ?? 'Article not found'}</p>
            <Link
              href="/news"
              className="bg-status-error hover:bg-status-error/80 rounded-lg px-4 py-2 text-white"
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
    <div className="bg-brand-bg min-h-screen">
      <Header user={user} navLinks={navLinks} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <article className="bg-brand-surface rounded-xl p-8 shadow-sm">
          {/* Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="bg-brand-accent/15 text-brand-primary inline-block rounded px-2 py-0.5 text-xs font-medium">
              {ARTICLE_SECTION_LABELS[article.section] ?? article.section}
            </span>
            {article.published_at && (
              <span className="text-brand-text-muted text-sm">
                Published {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
              </span>
            )}
            {canEdit && (
              <Link
                href={`/news/${article.slug}/edit`}
                className="text-brand-primary hover:text-brand-primary ml-auto text-sm font-medium"
              >
                Edit
              </Link>
            )}
          </div>

          <h1 className="text-brand-text-primary mb-4 text-3xl leading-tight font-bold">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-brand-text-secondary mb-6 text-lg leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Body */}
          <div className="prose prose-lg text-brand-text-primary max-w-none whitespace-pre-wrap">
            {article.body}
          </div>

          {/* Footer */}
          <div className="border-brand-secondary/20 mt-8 border-t pt-6">
            <Link
              href="/news"
              className="text-brand-primary hover:text-brand-primary text-sm font-medium"
            >
              &larr; Back to Campus News
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
