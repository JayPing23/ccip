'use client';

import RolesList from '@/modules/admin/components/RolesList';

/**
 * Admin Role Management Page — auth guard handled by admin layout
 */
export default function AdminRolesPage() {
  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-brand-text-primary text-2xl font-bold">Roles &amp; Permissions</h2>
        <p className="text-brand-text-secondary mt-1">
          Understand the role hierarchy and permissions in your system.
        </p>
      </div>

      <div className="bg-brand-surface rounded-lg p-6 shadow-sm">
        <RolesList />
      </div>

      {/* Permissions Matrix */}
      <div className="bg-brand-surface mt-8 rounded-lg p-6 shadow-sm">
        <h3 className="text-brand-text-primary mb-6 text-xl font-bold">Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-brand-secondary/20 bg-brand-bg border-b">
                <th className="text-brand-text-primary px-4 py-3 text-left font-semibold">
                  Permission
                </th>
                <th className="text-brand-text-primary px-4 py-3 text-center font-semibold">
                  STUDENT
                </th>
                <th className="text-brand-text-primary px-4 py-3 text-center font-semibold">
                  DEPT_EDITOR
                </th>
                <th className="text-brand-text-primary px-4 py-3 text-center font-semibold">
                  UNIV_EDITOR
                </th>
                <th className="text-brand-text-primary px-4 py-3 text-center font-semibold">
                  SUPER_ADMIN
                </th>
              </tr>
            </thead>
            <tbody className="divide-brand-secondary/20 divide-y">
              {[
                ['View Published Content', true, true, true, true],
                ['Create Content', false, true, true, true],
                ['Edit Own Content', false, true, true, true],
                ['Publish Content', false, true, true, true],
                ['Manage All Users', false, false, false, true],
                ['Assign Roles', false, false, false, true],
                ['Manage Organizations', false, false, false, true],
              ].map(([label, s, d, u, a]) => (
                <tr key={label as string}>
                  <td className="text-brand-text-primary px-4 py-3 font-medium">{label}</td>
                  <td className="px-4 py-3 text-center">{s ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{d ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{u ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{a ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
