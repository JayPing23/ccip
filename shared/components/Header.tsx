'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import NotificationBell from '@/modules/notifications/components/NotificationBell';
import NotificationCenter from '@/modules/notifications/components/NotificationCenter';
import { useUnreadCount } from '@/modules/notifications/hooks/useNotifications';
import type { IUser } from '@/shared/types/database.types';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';

interface HeaderLink {
  href: string;
  label: string;
}

interface HeaderAction extends HeaderLink {
  tone?: 'primary' | 'neutral';
}

interface HeaderProps {
  user?: Pick<IUser, 'id' | 'email' | 'display_name' | 'avatar_url'> | null;
  navLinks?: HeaderLink[];
  actions?: HeaderAction[];
  brandHref?: string;
  brandLabel?: string;
}

const DEFAULT_NAV_LINKS: HeaderLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/feed', label: 'Announcements' },
  { href: '/news', label: 'Campus News' },
  { href: '/forum', label: 'Forum' },
];

export default function Header({
  user,
  navLinks = DEFAULT_NAV_LINKS,
  actions = [],
  brandHref = '/dashboard',
  brandLabel = 'CCIP',
}: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { refresh: refreshUnread } = useUnreadCount();

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((prev) => !prev);
  }, []);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow" role="banner">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"
        aria-label="Main navigation"
      >
        <Link href={brandHref} className="text-xl font-bold text-gray-900">
          {brandLabel}
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-700 hover:text-gray-900">
                {link.label}
              </Link>
            ))}
          </div>

          {actions.length > 0 && (
            <div className="hidden items-center gap-2 lg:flex">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.tone === 'primary'
                      ? 'rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700'
                      : 'rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}

          <div className="relative">
            <NotificationBell onClick={toggleNotifications} />
            <NotificationCenter
              open={notificationsOpen}
              onClose={closeNotifications}
              onCountChange={refreshUnread}
            />
          </div>

          <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
            {user.avatar_url && (
              <Image
                src={user.avatar_url}
                alt={user.display_name}
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
                unoptimized
              />
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-700">{user.display_name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
