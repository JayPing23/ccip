import { ActivityFeed, StatsGrid } from '@/modules/admin/components/Dashboard';
import { getCurrentUser } from '@/modules/users/users.service';
import { canAccessAdminConsole } from '@/shared/utils/permissions';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.role_name || !canAccessAdminConsole(user.role_name)) redirect('/dashboard');

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="text-brand-text-primary text-2xl font-bold">Dashboard</h2>
        <p className="text-brand-text-secondary mt-1">Welcome back, {user.display_name}.</p>
      </div>
      <div className="mb-8">
        <StatsGrid />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm">
          <h3 className="text-brand-text-primary mb-4 text-lg font-bold">Quick Actions</h3>
          <nav className="space-y-2">
            <a
              href="/admin/users"
              className="text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-primary flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <span>Users</span>
            </a>
            <a
              href="/admin/organizations"
              className="text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-primary flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <span>Organizations</span>
            </a>
            <a
              href="/admin/roles"
              className="text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-primary flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <span>Roles</span>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
