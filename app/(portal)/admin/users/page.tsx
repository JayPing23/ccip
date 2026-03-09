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
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-gray-600">View and manage all users, assign roles and organizations.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800"><strong>Error:</strong> {error}</p>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <UserListTable users={users} loading={loading} onRefresh={refetch} />
      </div>
    </div>
  );
}
