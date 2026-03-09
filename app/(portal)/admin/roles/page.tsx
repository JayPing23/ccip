'use client';

import RolesList from '@/modules/admin/components/RolesList';

/**
 * Admin Role Management Page — auth guard handled by admin layout
 */
export default function AdminRolesPage() {
  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h2>
        <p className="mt-1 text-gray-600">Understand the role hierarchy and permissions in your system.</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <RolesList />
      </div>

      {/* Permissions Matrix */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-gray-900">Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Permission</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">STUDENT</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">DEPT_EDITOR</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">UNIV_EDITOR</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">SUPER_ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                  <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
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
