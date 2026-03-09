content = '''import { ActivityFeed, StatsGrid } from '@/modules/admin/components/Dashboard';
import { getCurrentUser } from '@/modules/users/users.service';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role_name !== 'SUPER_ADMIN') redirect('/dashboard');

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-gray-600">Welcome back, {user.display_name}.</p>
      </div>
      <div className="mb-8">
        <StatsGrid />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>
          <nav className="space-y-2">
            <a href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">
              <span>Users</span>
            </a>
            <a href="/admin/organizations" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">
              <span>Organizations</span>
            </a>
            <a href="/admin/roles" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">
              <span>Roles</span>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
'''
with open(r'c:\CRACK\ccip\app\(portal)\admin\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
