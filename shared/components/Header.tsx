'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import NotificationBell from '@/modules/notifications/components/NotificationBell';
import NotificationCenter from '@/modules/notifications/components/NotificationCenter';
import { useUnreadCount } from '@/modules/notifications/hooks/useNotifications';
import ThemeToggle from '@/shared/components/ThemeToggle';
import type { IUser } from '@/shared/types/database.types';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { refresh: refreshUnread } = useUnreadCount();
  const pathname = usePathname();

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
    <header
      className="bg-brand-surface dark:bg-brand-dark-bg dark:border-brand-secondary/30 sticky top-0 z-40 shadow-sm dark:border-b"
      role="banner"
    >
      <a
        href="#main-content"
        className="focus:bg-brand-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="text-brand-text-secondary hover:text-brand-primary rounded-md p-2 md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            {...{ 'aria-expanded': mobileMenuOpen }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <Link href={brandHref} className="text-brand-primary text-xl font-bold">
            {brandLabel}
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (pathname?.startsWith(link.href + '/') ?? false);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? 'text-brand-primary border-brand-accent border-b-2 pb-0.5 font-semibold'
                      : 'text-brand-text-secondary hover:text-brand-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {actions.length > 0 && (
            <div className="hidden items-center gap-2 lg:flex">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.tone === 'primary'
                      ? 'bg-brand-primary hover:bg-brand-primary/90 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-150'
                      : 'border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}

          <ThemeToggle />

          <div className="relative">
            <NotificationBell onClick={toggleNotifications} />
            <NotificationCenter
              open={notificationsOpen}
              onClose={closeNotifications}
              onCountChange={refreshUnread}
            />
          </div>

          <div className="border-brand-secondary/30 hidden items-center gap-3 border-l pl-6 sm:flex">
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
              <p className="text-brand-text-primary text-sm font-medium">{user.display_name}</p>
              <p className="text-brand-text-muted text-xs">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="bg-brand-surface border-brand-secondary/20 border-t md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (pathname?.startsWith(link.href + '/') ?? false);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-accent/15 text-brand-primary'
                      : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  action.tone === 'primary'
                    ? 'bg-brand-primary block rounded-lg px-3 py-2 text-sm font-medium text-white'
                    : 'text-brand-text-secondary hover:bg-brand-bg block rounded-lg px-3 py-2 text-sm font-medium'
                }
              >
                {action.label}
              </Link>
            ))}
            <div className="border-brand-secondary/20 flex items-center gap-3 border-t pt-3">
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
              <div className="min-w-0 flex-1">
                <p className="text-brand-text-primary truncate text-sm font-medium">
                  {user.display_name}
                </p>
                <p className="text-brand-text-muted truncate text-xs">{user.email}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
