'use client';

import { useUnreadCount } from '@/modules/notifications/hooks/useNotifications';

interface NotificationBellProps {
  onClick?: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount, hasUnread, loading } = useUnreadCount();

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-brand-text-secondary hover:bg-brand-secondary/10 hover:text-brand-text-primary focus:ring-brand-primary relative rounded-full p-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      aria-label={hasUnread ? `Notifications (${unreadCount} unread)` : 'Notifications'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>

      {!loading && hasUnread && (
        <span className="animate-bell-pulse bg-status-error absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
