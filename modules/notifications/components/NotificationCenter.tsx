'use client';

import {
  useMarkAllRead,
  useMarkRead,
  useNotificationList,
} from '@/modules/notifications/hooks/useNotifications';
import type { NotificationListItem } from '@/modules/notifications/types';
import { getRelativeTime } from '@/shared/utils/date-helpers';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  onCountChange?: () => void;
}

function NotificationRow({
  notification,
  onMarkRead,
  markingId,
}: {
  notification: NotificationListItem;
  onMarkRead: (id: string) => void;
  markingId: string | null;
}) {
  const isUnread = !notification.read_at;
  const isMarking = markingId === notification.id;

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
        isUnread ? 'bg-blue-50' : 'bg-white'
      } hover:bg-gray-50`}
    >
      {isUnread && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
      )}
      {!isUnread && <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden="true" />}

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {notification.notification_text ?? notification.content_title ?? 'Notification'}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{getRelativeTime(notification.created_at)}</p>
      </div>

      {isUnread && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
          disabled={isMarking}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
          aria-label="Mark as read"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );

  if (notification.content_slug) {
    return (
      <Link href={`/feed/${notification.content_slug}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function NotificationCenter({
  open,
  onClose,
  onCountChange,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    items,
    total,
    loading,
    error,
    refresh: refreshList,
  } = useNotificationList({ unreadOnly: filter === 'unread' });

  const handleItemRead = useCallback(() => {
    void refreshList();
    onCountChange?.();
  }, [refreshList, onCountChange]);

  const { markRead, loadingId } = useMarkRead(handleItemRead);

  const handleAllRead = useCallback(() => {
    void refreshList();
    onCountChange?.();
  }, [refreshList, onCountChange]);

  const { markAllRead, loading: markingAll } = useMarkAllRead(handleAllRead);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Refresh when opening
  useEffect(() => {
    if (open) {
      void refreshList();
    }
  }, [open, refreshList]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute top-full right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-xs font-medium ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 px-4 py-2 text-xs font-medium ${
            filter === 'unread'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading && items.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
          </div>
        )}

        {error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void refreshList()}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        )}

        {items.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onMarkRead={(id) => void markRead(id)}
            markingId={loadingId}
          />
        ))}
      </div>

      {/* Footer */}
      {total > items.length && (
        <div className="border-t border-gray-100 px-4 py-2 text-center">
          <p className="text-xs text-gray-500">
            Showing {items.length} of {total}
          </p>
        </div>
      )}
    </div>
  );
}
