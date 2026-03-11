'use client';

import ArticleForm from '@/modules/publication/components/ArticleForm';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { canCreateArticle } from '@/shared/utils/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Create Article Page
 * Allows authenticated editors to create new publication articles.
 */
export default function CreateArticlePage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.role_name || !canCreateArticle(user.role_name)) {
      router.replace('/dashboard');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <p className="text-brand-text-secondary">Loading editor workspace...</p>
      </div>
    );
  }

  return <ArticleForm />;
}
