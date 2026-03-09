import type { INotificationPreference } from '@/shared/types/database.types';
import type {
  NotificationDeliveryDecision,
  NotificationListItem,
  UnreadNotificationSummary,
} from '@/modules/notifications/types';

type NotificationPreferenceSnapshot = Pick<
  INotificationPreference,
  'in_app_enabled' | 'email_enabled' | 'email_digest'
>;

export const DEFAULT_NOTIFICATION_PREFERENCE: NotificationPreferenceSnapshot = {
  in_app_enabled: true,
  email_enabled: true,
  email_digest: 'DAILY',
};

export function splitNotificationsByReadState(notifications: NotificationListItem[]): {
  unread: NotificationListItem[];
  read: NotificationListItem[];
} {
  return notifications.reduce(
    (groups, notification) => {
      if (notification.read_at) {
        groups.read.push(notification);
      } else {
        groups.unread.push(notification);
      }

      return groups;
    },
    {
      unread: [] as NotificationListItem[],
      read: [] as NotificationListItem[],
    }
  );
}

export function getUnreadNotificationSummary(
  notifications: Array<Pick<NotificationListItem, 'read_at'>>
): UnreadNotificationSummary {
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

export function resolveNotificationDelivery(
  preference?: Partial<NotificationPreferenceSnapshot>
): NotificationDeliveryDecision {
  const effectivePreference = {
    ...DEFAULT_NOTIFICATION_PREFERENCE,
    ...preference,
  };

  return {
    shouldCreateInApp: effectivePreference.in_app_enabled,
    shouldSendEmail:
      effectivePreference.email_enabled && effectivePreference.email_digest !== 'NONE',
    emailDigest: effectivePreference.email_digest,
  };
}
