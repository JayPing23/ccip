'use client';

import type { IUser } from '@/shared/types/database.types';
import {
  canAccessAdminConsole,
  canAccessContentManager,
  canCreateContent,
} from '@/shared/utils/permissions';
import { useCallback, useEffect, useState } from 'react';

export function useCurrentUser() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me');

      if (response.status === 401) {
        setUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load the current user');
      }

      const result = await response.json();
      setUser(result.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the current user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    loading,
    error,
    refresh,
    isAuthenticated: Boolean(user),
    canCreateAnnouncements: Boolean(user?.role_name && canCreateContent(user.role_name)),
    canManageAnnouncements: Boolean(user?.role_name && canAccessContentManager(user.role_name)),
    canAccessAdminConsole: Boolean(user?.role_name && canAccessAdminConsole(user.role_name)),
  };
}
