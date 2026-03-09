'use client';

import { ToastProvider } from '@/modules/admin/components/Toast';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/organizations', label: 'Organizations', icon: '🏢' },
  { href: '/admin/roles', label: 'Roles', icon: '🔑' },
  { href: '/admin/content', label: 'Content', icon: '📰' },
];

/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation and permission guard
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<{ display_name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        const user = data.data;
        if (!user || user.role_name !== 'SUPER_ADMIN') {
          router.replace('/dashboard');
          return;
        }
        setAdminUser({ display_name: user.display_name, email: user.email });
      } catch {
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-gray-400">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-gray-700 px-6">
          <span className="text-lg font-bold text-white">CCIP Admin</span>
        </div>

        {/* Nav */}
        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 my-4 border-t border-gray-700" />

        {/* Bottom links */}
        <div className="px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ← Portal Dashboard
          </Link>
        </div>

        {/* User info */}
        {adminUser && (
          <div className="absolute right-0 bottom-0 left-0 border-t border-gray-700 px-4 py-4">
            <p className="truncate text-sm font-medium text-white">{adminUser.display_name}</p>
            <p className="truncate text-xs text-gray-400">{adminUser.email}</p>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              ADMIN
            </span>
            <span className="hidden text-sm text-gray-600 sm:block">{adminUser?.display_name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
