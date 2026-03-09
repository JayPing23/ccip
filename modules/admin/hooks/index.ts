'use client';

import type { IOrganization } from '@/shared/types/database.types';
import { useEffect, useState } from 'react';
import type { UserWithRole } from '../types/index';

interface UpdateUserPayload {
  role_id?: string;
  org_id?: string;
}

interface UpdateOrganizationPayload {
  name?: string;
  parent_id?: string | null;
  type?: IOrganization['type'];
}

/**
 * Hook to fetch and manage admin users
 */
export function useAdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
}

/**
 * Hook to update user role and organization
 */
export function useUpdateUser() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (userId: string, roleId?: string, orgId?: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const payload: UpdateUserPayload = {};
      if (roleId) payload.role_id = roleId;
      if (orgId) payload.org_id = orgId;

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update user');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUser, isUpdating, error };
}

/**
 * Hook to fetch and manage organizations
 */
export function useAdminOrganizations() {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return { organizations, loading, error, refetch: fetchOrganizations };
}

/**
 * Hook to create/update organization
 */
export function useUpdateOrganization() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrganization = async (orgId: string, data: UpdateOrganizationPayload) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error?.message || 'Failed to update organization');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateOrganization, isUpdating, error };
}

/**
 * Hook to delete organization
 */
export function useDeleteOrganization() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteOrganization = async (orgId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete organization');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteOrganization, isDeleting, error };
}
