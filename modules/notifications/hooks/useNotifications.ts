'use client';

import type {
  NotificationListResult,
  NotificationPreferenceInput,
  UnreadNotificationSummary,
} from '@/modules/notifications/types';
import type { INotificationPreference } from '@/shared/types/database.types';
import { useCallback, useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 60_000;

export function useUnreadCount() {
  const [summary, setSummary] = useState<UnreadNotificationSummary>({
    unreadCount: 0,
    hasUnread: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/notifications/unread');

      if (response.status === 401) {
        setSummary({ unreadCount: 0, hasUnread: false });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const result = await response.json();
      setSummary(result.data ?? { unreadCount: 0, hasUnread: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unread count');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  return { ...summary, loading, error, refresh };
}

export function useMarkAllRead(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const markAllRead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', { method: 'PATCH' });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { markAllRead, loading };
}

export function useNotificationList(params?: { page?: number; unreadOnly?: boolean }) {
  const [result, setResult] = useState<NotificationListResult>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = params?.page ?? 1;
  const unreadOnly = params?.unreadOnly ?? false;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      if (unreadOnly) searchParams.set('unreadOnly', 'true');

      const response = await fetch(`/api/notifications?${searchParams.toString()}`);

      if (response.status === 401) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const json = await response.json();
      setResult(json.data ?? { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh };
}

export function useMarkRead(onSuccess?: (id: string) => void) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const markRead = useCallback(
    async (id: string) => {
      try {
        setLoadingId(id);
        const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        onSuccess?.(id);
      } finally {
        setLoadingId(null);
      }
    },
    [onSuccess]
  );

  return { markRead, loadingId };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<INotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');

      if (response.status === 401) {
        setPreferences([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const json = await response.json();
      setPreferences(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { preferences, loading, error, refresh };
}

export function useUpsertPreference(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsert = useCallback(
    async (input: NotificationPreferenceInput) => {
      try {
        setSaving(true);
        setError(null);
        const response = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(
            (json as { error?: string } | null)?.error ?? 'Failed to save preference'
          );
        }

        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save preference');
      } finally {
        setSaving(false);
      }
    },
    [onSuccess]
  );

  return { upsert, saving, error };
}
