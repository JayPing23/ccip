'use client';

import { useToast } from '@/shared/components/Toast';
import React, { useState } from 'react';
import { useUpdateUser } from '../hooks/index';
import type { UserWithRole } from '../types/index';

const PAGE_SIZE = 20;

interface UserListTableProps {
  users: UserWithRole[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * User List Table
 * Full-featured table with search, role filter, sort, pagination, and edit modal.
 */
export default function UserListTable({ users, loading, onRefresh }: UserListTableProps) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'joined'>('name');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const { updateUser, isUpdating } = useUpdateUser();
  const { showToast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <span className="text-brand-text-muted ml-3">Loading users...</span>
      </div>
    );
  }

  // Filter
  let filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = !filterRole || u.role_name === filterRole;
    return matchesSearch && matchesRole;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'email':
        return a.email.localeCompare(b.email);
      case 'joined':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return a.display_name.localeCompare(b.display_name);
    }
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaveUser = async (userId: string, roleId: string, orgId: string) => {
    try {
      await updateUser(userId, roleId, orgId || undefined);
      setSelectedUser(null);
      onRefresh();
      showToast('User updated successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label className="text-brand-text-secondary mb-1 block text-xs font-medium">Search</label>
          <input
            type="text"
            placeholder="Name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border-brand-secondary/30 focus:border-brand-secondary w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="filter-role"
            className="text-brand-text-secondary mb-1 block text-xs font-medium"
          >
            Role
          </label>
          <select
            id="filter-role"
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setPage(1);
            }}
            className="border-brand-secondary/30 rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="DEPT_EDITOR">Dept Editor</option>
            <option value="UNIVERSITY_EDITOR">Univ Editor</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="sort-by"
            className="text-brand-text-secondary mb-1 block text-xs font-medium"
          >
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border-brand-secondary/30 rounded-md border px-3 py-2 text-sm"
          >
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="joined">Joined</option>
          </select>
        </div>
        <p className="text-brand-text-muted ml-auto text-sm">{filtered.length} users</p>
      </div>

      {/* Table */}
      <div className="border-brand-secondary/20 overflow-x-auto rounded-lg border">
        <table className="divide-brand-secondary/20 min-w-full divide-y text-sm">
          <thead className="bg-brand-bg">
            <tr>
              <th className="text-brand-text-secondary px-4 py-3 text-left font-medium uppercase">
                Name
              </th>
              <th className="text-brand-text-secondary px-4 py-3 text-left font-medium uppercase">
                Email
              </th>
              <th className="text-brand-text-secondary px-4 py-3 text-left font-medium uppercase">
                Role
              </th>
              <th className="text-brand-text-secondary px-4 py-3 text-left font-medium uppercase">
                Joined
              </th>
              <th className="text-brand-text-secondary px-4 py-3 text-left font-medium uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-brand-secondary/20 bg-brand-surface divide-y">
            {paginated.map((user) => (
              <tr key={user.id} className="hover:bg-brand-bg">
                <td className="text-brand-text-primary px-4 py-3 font-medium">
                  {user.display_name}
                </td>
                <td className="text-brand-text-muted px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-brand-accent/15 text-brand-primary inline-flex rounded-full px-2 py-0.5 text-xs font-semibold">
                    {user.role_name?.replace(/_/g, ' ') ?? 'Unknown'}
                  </span>
                </td>
                <td className="text-brand-text-muted px-4 py-3">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-brand-primary hover:text-brand-primary font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginated.length === 0 && (
        <p className="text-brand-text-muted py-8 text-center">No users match your filter.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-brand-secondary/30 rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-brand-text-secondary text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-brand-secondary/30 rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleSaveUser}
          isUpdating={isUpdating}
        />
      )}
    </>
  );
}

interface UserEditModalProps {
  user: UserWithRole;
  onClose: () => void;
  onSave: (userId: string, roleId: string, orgId: string) => Promise<void>;
  isUpdating: boolean;
}

function UserEditModal({ user, onClose, onSave, isUpdating }: UserEditModalProps) {
  const [roleId, setRoleId] = React.useState(user.role_id ?? '');
  const [orgId, setOrgId] = React.useState(user.org_id ?? '');
  const [roles, setRoles] = React.useState<Array<{ id: string; name: string }>>([]);
  const [orgs, setOrgs] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/roles').then((r) => r.json()),
      fetch('/api/organizations').then((r) => r.json()),
    ]).then(([rData, oData]) => {
      setRoles(rData.data ?? []);
      setOrgs(oData.data ?? []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(user.id, roleId, orgId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-brand-surface w-full max-w-md rounded-xl p-6 shadow-2xl">
        <h3 className="text-brand-text-primary mb-4 text-lg font-bold">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="text-brand-text-secondary block text-sm font-medium"
            >
              Name
            </label>
            <input
              id="edit-name"
              value={user.display_name}
              disabled
              className="border-brand-secondary/30 bg-brand-bg text-brand-text-secondary mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="edit-email"
              className="text-brand-text-secondary block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="edit-email"
              value={user.email}
              disabled
              className="border-brand-secondary/30 bg-brand-bg text-brand-text-secondary mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="edit-role"
              className="text-brand-text-secondary block text-sm font-medium"
            >
              Role
            </label>
            <select
              id="edit-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="border-brand-secondary/30 mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="edit-org"
              className="text-brand-text-secondary block text-sm font-medium"
            >
              Organization
            </label>
            <select
              id="edit-org"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="border-brand-secondary/30 mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-brand-primary hover:bg-brand-primary/80 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
