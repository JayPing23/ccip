'use client';

import { LogoutButton } from '@/modules/auth/components/LogoutButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

interface HeaderProps {
  user?: User;
  showAdminLinks?: boolean;
}

export default function Header({ user, showAdminLinks = false }: HeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          CCIP
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
            Feed
          </Link>

          {showAdminLinks && (
            <>
              <Link href="/admin/content" className="text-gray-700 hover:text-gray-900">
                Manage Posts
              </Link>
              <Link href="/content/create" className="text-gray-700 hover:text-gray-900">
                New Post
              </Link>
            </>
          )}

          <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
            {user.avatar_url && (
              <img src={user.avatar_url} alt={user.display_name} className="h-8 w-8 rounded-full" />
            )}
            <span className="text-sm text-gray-700">{user.display_name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
