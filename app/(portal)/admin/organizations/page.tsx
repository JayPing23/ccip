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
        <h2 className="text-brand-text-primary text-2xl font-bold">Organizations</h2>
        <p className="text-brand-text-secondary mt-1">
          Manage your organization hierarchy and structure.
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
        <OrganizationList organizations={organizations} loading={loading} onRefresh={refetch} />
      </div>
    </div>
  );
}
