'use client';

import ArticleForm from '@/modules/publication/components/ArticleForm';
import PublicationWorkflowPanel from '@/modules/publication/components/PublicationWorkflowPanel';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  canEditAnyArticle,
  canEditOwnArticle,
  canPublishArticle,
  canReviewArticle,
} from '@/shared/utils/permissions';
import type { IArticle } from '@/modules/publication/types';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Edit Article Page
 * Loads an article by slug for editing and displays the editorial workflow panel.
 */
export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: userLoading } = useCurrentUser();

  const [article, setArticle] = useState<IArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/publication?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Article not found');
        const json = await res.json();
        const fetched = json.data as IArticle | null;
        if (!fetched) {
          setError('Article not found');
          return;
        }
        setArticle(fetched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) void fetchArticle();
  }, [slug]);

  const handleWorkflowUpdate = useCallback((updated: IArticle) => {
    setArticle(updated);
  }, []);

  if (userLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="mb-4 text-red-700">{error ?? 'Article not found'}</p>
          <button
            onClick={() => router.push('/news')}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Permission checks
  const isOwner = article.author_id === user.id;
  const canEdit = isOwner
    ? user.role_name
      ? canEditOwnArticle(user.role_name)
      : false
    : user.role_name
      ? canEditAnyArticle(user.role_name)
      : false;

  if (!canEdit) {
    router.replace('/dashboard');
    return null;
  }

  const userCanReview = user.role_name ? canReviewArticle(user.role_name) : false;
  const userCanPublish = user.role_name ? canPublishArticle(user.role_name) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ArticleForm initialArticle={article} onSuccess={handleWorkflowUpdate} />
        </div>
        <div>
          <PublicationWorkflowPanel
            article={article}
            canReview={userCanReview}
            canPublish={userCanPublish}
            onUpdate={handleWorkflowUpdate}
          />
        </div>
      </div>
    </div>
  );
}
