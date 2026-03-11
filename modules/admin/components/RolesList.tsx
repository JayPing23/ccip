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
  SUPER_ADMIN: 'Full system access. Can manage users, organizations, roles, and all content.',
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
        const [rolesRes, usersRes] = await Promise.all([fetch('/api/roles'), fetch('/api/users')]);
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
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <span className="text-brand-text-muted ml-3">Loading roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-status-error/20 bg-status-error/10 text-status-error rounded-md border px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roles.map((role) => (
        <div
          key={role.id}
          className="border-brand-secondary/20 bg-brand-surface rounded-xl border p-5 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="bg-brand-accent/15 text-brand-primary inline-flex rounded-full px-3 py-0.5 text-xs font-bold tracking-wide uppercase">
              {role.name.replace(/_/g, ' ')}
            </span>
            <span className="text-brand-text-muted text-sm">
              {role.user_count ?? 0} {role.user_count === 1 ? 'user' : 'users'}
            </span>
          </div>
          <p className="text-brand-text-secondary text-sm">{role.description}</p>
        </div>
      ))}
    </div>
  );
}
