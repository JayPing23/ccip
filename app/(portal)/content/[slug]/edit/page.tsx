'use client';

import ContentForm from '@/modules/content/components/ContentForm';
import type { IContent } from '@/shared/types/database.types';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Edit Content Page
 * Allows the content author or admin to edit an announcement
 */
export default function EditContentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [content, setContent] = useState<IContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading content...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="font-medium text-red-600">{error || 'Content not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return <ContentForm initialContent={content} isAdmin={true} />;
}
