'use client';

import type { IContent } from '@/shared/types/database.types';
import { useEffect, useState } from 'react';

interface UseContentOptions {
  visibility?: 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY';
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  limit?: number;
}

/**
 * useContent Hook
 * Fetches content from the API with optional filtering
 */
export function useContent(options?: UseContentOptions) {
  const [content, setContent] = useState<IContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query string
        const params = new URLSearchParams();
        if (options?.visibility) params.append('visibility', options.visibility);
        if (options?.status) params.append('status', options.status);
        if (options?.limit) params.append('limit', options.limit.toString());

        const queryString = params.toString();
        const url = `/api/content${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [options?.visibility, options?.status, options?.limit]);

  return { content, loading, error };
}
