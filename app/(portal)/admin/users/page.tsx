'use client';

import UserListTable from '@/modules/admin/components/UserListTable';
import { useAdminUsers } from '@/modules/admin/hooks/index';

/**
 * Admin User Management Page — auth guard handled by admin layout
 */
export default function AdminUsersPage() {
  const { users, loading, error, refetch } = useAdminUsers();

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-brand-text-primary text-2xl font-bold">User Management</h2>
        <p className="text-brand-text-secondary mt-1">
          View and manage all users, assign roles and organizations.
        </p>
      </div>

      {error && (
        <div className="border-status-error/20 bg-status-error/10 mb-6 rounded-lg border p-4">
          <p className="text-status-error">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="bg-brand-surface rounded-lg p-6 shadow-sm">
        <UserListTable users={users} loading={loading} onRefresh={refetch} />
      </div>
    </div>
  );
}
