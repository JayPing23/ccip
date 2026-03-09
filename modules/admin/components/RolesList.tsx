'use client';

import { useEffect, useState } from 'react';

interface RoleInfo {
  id: string;
  name: string;
  description?: string;
  user_count?: number;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  STUDENT: 'Read-only access to published content. The default role for all registered users.',
  DEPT_EDITOR: 'Can create and manage content within their assigned department/organization.',
  UNIVERSITY_EDITOR:
    'Can create and manage content across all departments and organizations university-wide.',
  SUPER_ADMIN:
    'Full system access. Can manage users, organizations, roles, and all content.',
};

/**
 * RolesList — displays all roles with descriptions and live user counts.
 */
export default function RolesList() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [rolesRes, usersRes] = await Promise.all([
          fetch('/api/roles'),
          fetch('/api/users'),
        ]);
        const rolesData = await rolesRes.json();
        const usersData = await usersRes.json();

        const roleList: RoleInfo[] = (rolesData.data ?? []).map((r: RoleInfo) => ({
          ...r,
          description: ROLE_DESCRIPTIONS[r.name] ?? '',
          user_count: 0,
        }));

        const users: Array<{ role_id: string }> = usersData.data ?? [];
        users.forEach((u) => {
          const role = roleList.find((r) => r.id === u.role_id);
          if (role) role.user_count = (role.user_count ?? 0) + 1;
        });

        setRoles(roleList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="ml-3 text-gray-500">Loading roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roles.map((role) => (
        <div
          key={role.id}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-indigo-800">
              {role.name.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-gray-500">
              {role.user_count ?? 0} {role.user_count === 1 ? 'user' : 'users'}
            </span>
          </div>
          <p className="text-sm text-gray-600">{role.description}</p>
        </div>
      ))}
    </div>
  );
}
