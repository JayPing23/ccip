import type { INotification, INotificationPreference } from '@/shared/types/database.types';

export type NotificationChannel = INotification['type'];
export type NotificationDigest = INotificationPreference['email_digest'];

export interface NotificationListItem extends INotification {
  content_slug?: string | null;
  content_title?: string | null;
}

export interface NotificationPreferenceInput {
  orgId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  emailDigest: NotificationDigest;
}

export interface NotificationDeliveryDecision {
  shouldCreateInApp: boolean;
  shouldSendEmail: boolean;
  emailDigest: NotificationDigest;
}

export interface UnreadNotificationSummary {
  unreadCount: number;
  hasUnread: boolean;
}
