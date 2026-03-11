'use client';

import ContentForm from '@/modules/content/components/ContentForm';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { IContent } from '@/shared/types/database.types';
import { canSchedulePosts } from '@/shared/utils/permissions';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Edit Content Page
 * Allows the content author or admin to edit an announcement
 */
export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: userLoading, canCreateAnnouncements } = useCurrentUser();

  const [content, setContent] = useState<IContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!canCreateAnnouncements) {
      router.replace('/dashboard');
    }
  }, [canCreateAnnouncements, router, user, userLoading]);

  useEffect(() => {
    async function fetchContent() {
      try {
        // Fetch content by slug
        const response = await fetch(`/api/content?slug=${slug}`);

        if (!response.ok) {
          throw new Error('Content not found');
        }

        const data = await response.json();

        // Handle array or single response
        const fetchedContent = Array.isArray(data.data) ? data.data[0] : data.data;

        if (!fetchedContent) {
          setError('Content not found');
          setIsLoading(false);
          return;
        }

        setContent(fetchedContent);
        setIsLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load content';
        setError(message);
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [slug]);

  if (userLoading || isLoading) {
    return (
      <div className="bg-brand-bg flex min-h-screen items-center justify-center">
        <div className="text-brand-text-secondary">Loading content...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="bg-brand-bg min-h-screen">
        <header className="border-brand-secondary/20 bg-brand-surface border-b shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <h1 className="text-brand-text-primary text-2xl font-bold">CCIP</h1>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="bg-brand-surface rounded-lg p-8 shadow">
            <p className="text-status-error font-medium">{error || 'Content not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ContentForm
      initialContent={content}
      canManagePublishing={user?.role_name ? canSchedulePosts(user.role_name) : false}
    />
  );
}
