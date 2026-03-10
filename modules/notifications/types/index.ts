import type { INotification, INotificationPreference } from '@/shared/types/database.types';

export type NotificationChannel = INotification['type'];
export type NotificationDigest = INotificationPreference['email_digest'];

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  'IN_APP',
  'EMAIL_IMMEDIATE',
  'EMAIL_DAILY',
  'EMAIL_WEEKLY',
] as const;

export const DIGEST_OPTIONS: readonly NotificationDigest[] = [
  'IMMEDIATE',
  'DAILY',
  'WEEKLY',
  'NONE',
] as const;

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

export interface NotificationCreateInput {
  userId: string;
  contentId?: string | null;
  type: NotificationChannel;
  notificationText: string;
}

export interface NotificationListParams {
  userId: string;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface NotificationListResult {
  items: NotificationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const NOTIFICATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
