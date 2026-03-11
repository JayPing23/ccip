'use client';

import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { canAccessAdminConsole } from '@/shared/utils/permissions';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/organizations', label: 'Organizations', icon: '🏢' },
  { href: '/admin/roles', label: 'Roles', icon: '🔑' },
  { href: '/admin/content', label: 'Content', icon: '📰' },
  { href: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
  { href: '/admin/retention', label: 'Retention', icon: '♻️' },
];

/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation and permission guard
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.role_name || !canAccessAdminConsole(user.role_name)) {
      router.replace('/dashboard');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="bg-brand-dark-bg flex min-h-screen items-center justify-center">
        <p className="text-brand-text-muted">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-brand-dark-bg fixed inset-y-0 left-0 z-50 w-64 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="border-brand-secondary/30 flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold text-white">CCIP Admin</span>
        </div>

        {/* Nav */}
        <nav className="mt-4 space-y-1 px-3" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-text-muted hover:bg-brand-primary/20 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-brand-secondary/30 mx-3 my-4 border-t" />

        {/* Bottom links */}
        <div className="px-3">
          <Link
            href="/dashboard"
            className="text-brand-text-muted hover:bg-brand-primary/20 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:text-white"
          >
            ← Portal Dashboard
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="border-brand-secondary/30 absolute right-0 bottom-0 left-0 border-t px-4 py-4">
            <p className="truncate text-sm font-medium text-white">{user.display_name}</p>
            <p className="text-brand-text-muted truncate text-xs">{user.email}</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-brand-surface border-brand-secondary/20 flex h-16 items-center justify-between border-b px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-brand-text-secondary hover:bg-brand-bg rounded-md p-2 lg:hidden"
            aria-label="Open sidebar navigation"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-status-error/15 text-status-error rounded-full px-2 py-0.5 text-xs font-semibold">
              ADMIN
            </span>
            <span className="text-brand-text-secondary hidden text-sm sm:block">
              {user?.display_name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
