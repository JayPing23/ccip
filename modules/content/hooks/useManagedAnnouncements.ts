'use client';

import type { IContent } from '@/shared/types/database.types';
import { useCallback, useEffect, useState } from 'react';

type StatusFilter = 'ALL' | IContent['status'];
type VisibilityFilter = 'ALL' | IContent['visibility'];

export function useManagedAnnouncements() {
  const [announcements, setAnnouncements] = useState<IContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      if (visibilityFilter !== 'ALL') {
        params.set('visibility', visibilityFilter);
      }

      const query = params.toString();
      const response = await fetch(`/api/content/manage${query ? `?${query}` : ''}`);

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error?.message || 'Failed to load managed announcements');
      }

      const result = await response.json();
      setAnnouncements(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load managed announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, visibilityFilter]);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const publishAnnouncement = useCallback(async (announcementId: string) => {
    const response = await fetch(`/api/content/${announcementId}/publish`, {
      method: 'POST',
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error?.message || 'Failed to publish announcement');
    }

    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.map((announcement) =>
        announcement.id === announcementId ? result.data : announcement
      )
    );

    return result?.data as IContent;
  }, []);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    const response = await fetch(`/api/content/${announcementId}`, {
      method: 'DELETE',
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error?.message || 'Failed to delete announcement');
    }

    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.filter((announcement) => announcement.id !== announcementId)
    );
  }, []);

  return {
    announcements,
    loading,
    error,
    statusFilter,
    visibilityFilter,
    setStatusFilter,
    setVisibilityFilter,
    refresh: fetchAnnouncements,
    publishAnnouncement,
    deleteAnnouncement,
  };
}
