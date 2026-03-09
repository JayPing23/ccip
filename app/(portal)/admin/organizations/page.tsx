'use client';

import OrganizationList from '@/modules/admin/components/OrganizationList';
import { useAdminOrganizations } from '@/modules/admin/hooks/index';

/**
 * Admin Organization Management Page — auth guard handled by admin layout
 */
export default function AdminOrganizationsPage() {
  const { organizations, loading, error, refetch } = useAdminOrganizations();

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
        <p className="mt-1 text-gray-600">Manage your organization hierarchy and structure.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800"><strong>Error:</strong> {error}</p>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <OrganizationList organizations={organizations} loading={loading} onRefresh={refetch} />
      </div>
    </div>
  );
}
