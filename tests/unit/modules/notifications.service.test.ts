/** @jest-environment node */

import {
  DEFAULT_NOTIFICATION_PREFERENCE,
  getUnreadNotificationSummary,
  resolveNotificationDelivery,
  splitNotificationsByReadState,
} from '@/modules/notifications/notifications.service';
import type { NotificationListItem } from '@/modules/notifications/types';

const baseItem: NotificationListItem = {
  id: 'n-1',
  user_id: 'user-1',
  content_id: 'content-1',
  type: 'IN_APP',
  notification_text: 'Test notification',
  read_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
  content_slug: 'test',
  content_title: 'Test',
};

describe('notifications.service – pure functions', () => {
  describe('splitNotificationsByReadState', () => {
    it('separates read and unread notifications', () => {
      const unread = { ...baseItem, id: 'n-1', read_at: null };
      const read = { ...baseItem, id: 'n-2', read_at: '2026-03-09T12:00:00.000Z' };

      const result = splitNotificationsByReadState([unread, read]);

      expect(result.unread).toHaveLength(1);
      expect(result.read).toHaveLength(1);
      expect(result.unread[0].id).toBe('n-1');
      expect(result.read[0].id).toBe('n-2');
    });

    it('returns empty arrays when no notifications', () => {
      const result = splitNotificationsByReadState([]);
      expect(result.unread).toEqual([]);
      expect(result.read).toEqual([]);
    });
  });

  describe('getUnreadNotificationSummary', () => {
    it('counts unread notifications', () => {
      const items = [{ read_at: null }, { read_at: null }, { read_at: '2026-03-09T12:00:00.000Z' }];

      const result = getUnreadNotificationSummary(items);

      expect(result.unreadCount).toBe(2);
      expect(result.hasUnread).toBe(true);
    });

    it('returns zero when all are read', () => {
      const items = [{ read_at: '2026-03-09T12:00:00.000Z' }];

      const result = getUnreadNotificationSummary(items);

      expect(result.unreadCount).toBe(0);
      expect(result.hasUnread).toBe(false);
    });

    it('returns zero for empty array', () => {
      const result = getUnreadNotificationSummary([]);
      expect(result.unreadCount).toBe(0);
      expect(result.hasUnread).toBe(false);
    });
  });

  describe('resolveNotificationDelivery', () => {
    it('returns defaults when no preference given', () => {
      const result = resolveNotificationDelivery();

      expect(result.shouldCreateInApp).toBe(true);
      expect(result.shouldSendEmail).toBe(true);
      expect(result.emailDigest).toBe('DAILY');
    });

    it('respects in_app_enabled = false', () => {
      const result = resolveNotificationDelivery({ in_app_enabled: false });

      expect(result.shouldCreateInApp).toBe(false);
      expect(result.shouldSendEmail).toBe(true);
    });

    it('disables email when email_digest is NONE', () => {
      const result = resolveNotificationDelivery({
        email_enabled: true,
        email_digest: 'NONE',
      });

      expect(result.shouldSendEmail).toBe(false);
    });

    it('disables email when email_enabled is false', () => {
      const result = resolveNotificationDelivery({
        email_enabled: false,
        email_digest: 'DAILY',
      });

      expect(result.shouldSendEmail).toBe(false);
    });

    it('merges partial preferences with defaults', () => {
      const result = resolveNotificationDelivery({ email_digest: 'WEEKLY' });

      expect(result.shouldCreateInApp).toBe(DEFAULT_NOTIFICATION_PREFERENCE.in_app_enabled);
      expect(result.emailDigest).toBe('WEEKLY');
    });
  });
});
