/** @jest-environment node */

/**
 * Tests for database-backed functions in notifications.service.ts
 *
 * Covers: listNotifications, getUnreadCount, createNotification,
 * markNotificationAsRead, markAllNotificationsAsRead,
 * getPreferences, getPreferenceForOrg, upsertPreference,
 * notifyOnPublish, notifyOnArticlePublish, notifyOnForumThread,
 * notifyOnForumReply, getRecentPublishedContent, getDigestRecipients
 */

import {
  createNotification,
  getDigestRecipients,
  getPreferenceForOrg,
  getPreferences,
  getRecentPublishedContent,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notifyOnArticlePublish,
  notifyOnForumReply,
  notifyOnForumThread,
  notifyOnPublish,
  upsertPreference,
} from '@/modules/notifications/notifications.service';
import { sendEmail } from '@/shared/lib/resend';
import type { IContent, INotification } from '@/shared/types/database.types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/shared/lib/resend', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  buildPublishEmailHtml: jest.fn().mockReturnValue('<p>Announcement</p>'),
  buildArticlePublishEmailHtml: jest.fn().mockReturnValue('<p>Article</p>'),
}));

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';

const mockedCreateClient = jest.mocked(createServerSupabaseClient);
const mockedSendEmail = jest.mocked(sendEmail);

// Chainable query builder factory
function buildChain(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'is',
    'in',
    'gte',
    'lte',
    'order',
    'range',
    'limit',
    'insert',
    'update',
    'upsert',
    'single',
    'maybeSingle',
    'head',
  ];
  for (const m of methods) {
    chain[m] = jest.fn(() => chain);
  }
  // Make it thenable
  chain.then = ((onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled)) as unknown as jest.Mock;
  return chain;
}

function mockSupabaseSingle(chain: ReturnType<typeof buildChain>) {
  const client = { from: jest.fn(() => chain) };
  mockedCreateClient.mockResolvedValue(client as never);
  return client;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('notifications.service – database-backed functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // listNotifications
  // =========================================================================
  describe('listNotifications', () => {
    it('returns paginated notifications with content join', async () => {
      const row = {
        id: 'n-1',
        user_id: 'u-1',
        content_id: 'c-1',
        type: 'IN_APP',
        notification_text: 'Hello',
        read_at: null,
        created_at: '2026-03-09T10:00:00Z',
        content: { slug: 'hello', title: 'Hello World' },
      };
      const chain = buildChain({ data: [row], count: 1, error: null });
      mockSupabaseSingle(chain);

      const result = await listNotifications({ userId: 'u-1', page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].content_slug).toBe('hello');
      expect(result.items[0].content_title).toBe('Hello World');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('applies unreadOnly filter', async () => {
      const chain = buildChain({ data: [], count: 0, error: null });
      mockSupabaseSingle(chain);

      await listNotifications({ userId: 'u-1', unreadOnly: true });

      expect(chain.is).toHaveBeenCalledWith('read_at', null);
    });

    it('respects MAX_PAGE_SIZE limit', async () => {
      const chain = buildChain({ data: [], count: 0, error: null });
      mockSupabaseSingle(chain);

      await listNotifications({ userId: 'u-1', pageSize: 500 });

      // range(from, to): from=0, to=99 → pageSize capped at 100
      expect(chain.range).toHaveBeenCalledWith(0, 99);
    });

    it('defaults page to 1 and pageSize to 20', async () => {
      const chain = buildChain({ data: [], count: 0, error: null });
      mockSupabaseSingle(chain);

      await listNotifications({ userId: 'u-1' });

      expect(chain.range).toHaveBeenCalledWith(0, 19); // (1-1)*20=0, 0+20-1=19
    });

    it('handles null content gracefully', async () => {
      const row = {
        id: 'n-2',
        user_id: 'u-1',
        content_id: null,
        type: 'IN_APP',
        notification_text: 'System message',
        read_at: null,
        created_at: '2026-03-09T10:00:00Z',
        content: null,
      };
      const chain = buildChain({ data: [row], count: 1, error: null });
      mockSupabaseSingle(chain);

      const result = await listNotifications({ userId: 'u-1' });

      expect(result.items[0].content_slug).toBeNull();
      expect(result.items[0].content_title).toBeNull();
    });

    it('throws on query error', async () => {
      const chain = buildChain({ data: null, error: { message: 'db fail' } });
      mockSupabaseSingle(chain);

      await expect(listNotifications({ userId: 'u-1' })).rejects.toThrow('db fail');
    });

    it('calculates totalPages correctly', async () => {
      const chain = buildChain({ data: [], count: 45, error: null });
      mockSupabaseSingle(chain);

      const result = await listNotifications({ userId: 'u-1', pageSize: 20 });

      expect(result.totalPages).toBe(3); // ceil(45/20) = 3
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================
  describe('getUnreadCount', () => {
    it('returns unread count and hasUnread=true', async () => {
      const chain = buildChain({ data: null, count: 5, error: null });
      mockSupabaseSingle(chain);

      const result = await getUnreadCount('u-1');

      expect(result.unreadCount).toBe(5);
      expect(result.hasUnread).toBe(true);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.eq).toHaveBeenCalledWith('type', 'IN_APP');
      expect(chain.is).toHaveBeenCalledWith('read_at', null);
    });

    it('returns hasUnread=false when count is 0', async () => {
      const chain = buildChain({ data: null, count: 0, error: null });
      mockSupabaseSingle(chain);

      const result = await getUnreadCount('u-1');

      expect(result.unreadCount).toBe(0);
      expect(result.hasUnread).toBe(false);
    });

    it('defaults to 0 when count is null', async () => {
      const chain = buildChain({ data: null, count: null, error: null });
      mockSupabaseSingle(chain);

      const result = await getUnreadCount('u-1');

      expect(result.unreadCount).toBe(0);
    });

    it('throws on error', async () => {
      const chain = buildChain({ data: null, count: null, error: { message: 'query err' } });
      mockSupabaseSingle(chain);

      await expect(getUnreadCount('u-1')).rejects.toThrow('query err');
    });
  });

  // =========================================================================
  // createNotification
  // =========================================================================
  describe('createNotification', () => {
    it('inserts and returns a notification', async () => {
      const created: INotification = {
        id: 'n-new',
        user_id: 'u-1',
        content_id: 'c-1',
        type: 'IN_APP',
        notification_text: 'Test',
        read_at: null,
        created_at: '2026-03-09T10:00:00Z',
      };
      const chain = buildChain({ data: created, error: null });
      mockSupabaseSingle(chain);

      const result = await createNotification({
        userId: 'u-1',
        contentId: 'c-1',
        type: 'IN_APP',
        notificationText: 'Test',
      });

      expect(result).toEqual(created);
      expect(chain.insert).toHaveBeenCalledWith({
        user_id: 'u-1',
        content_id: 'c-1',
        type: 'IN_APP',
        notification_text: 'Test',
      });
      expect(chain.single).toHaveBeenCalled();
    });

    it('defaults content_id to null', async () => {
      const chain = buildChain({ data: { id: 'n-x' }, error: null });
      mockSupabaseSingle(chain);

      await createNotification({
        userId: 'u-1',
        type: 'IN_APP',
        notificationText: 'No content',
      });

      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ content_id: null }));
    });

    it('throws on insert error', async () => {
      const chain = buildChain({ data: null, error: { message: 'insert failed' } });
      mockSupabaseSingle(chain);

      await expect(
        createNotification({ userId: 'u-1', type: 'IN_APP', notificationText: 'x' })
      ).rejects.toThrow('insert failed');
    });
  });

  // =========================================================================
  // markNotificationAsRead
  // =========================================================================
  describe('markNotificationAsRead', () => {
    it('updates read_at for the given notification and user', async () => {
      const updated: INotification = {
        id: 'n-1',
        user_id: 'u-1',
        content_id: null,
        type: 'IN_APP',
        notification_text: 'Hello',
        read_at: '2026-03-09T12:00:00Z',
        created_at: '2026-03-09T10:00:00Z',
      };
      const chain = buildChain({ data: updated, error: null });
      mockSupabaseSingle(chain);

      const result = await markNotificationAsRead('n-1', 'u-1');

      expect(result).toEqual(updated);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ read_at: expect.any(String) })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'n-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.single).toHaveBeenCalled();
    });

    it('throws on error (e.g. not found)', async () => {
      const chain = buildChain({ data: null, error: { message: 'PGRST116: not found' } });
      mockSupabaseSingle(chain);

      await expect(markNotificationAsRead('n-999', 'u-1')).rejects.toThrow('PGRST116');
    });
  });

  // =========================================================================
  // markAllNotificationsAsRead
  // =========================================================================
  describe('markAllNotificationsAsRead', () => {
    it('marks all unread notifications and returns count', async () => {
      const chain = buildChain({
        data: [{ id: 'n-1' }, { id: 'n-2' }, { id: 'n-3' }],
        error: null,
      });
      mockSupabaseSingle(chain);

      const count = await markAllNotificationsAsRead('u-1');

      expect(count).toBe(3);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ read_at: expect.any(String) })
      );
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.is).toHaveBeenCalledWith('read_at', null);
    });

    it('returns 0 when no unread notifications', async () => {
      const chain = buildChain({ data: [], error: null });
      mockSupabaseSingle(chain);

      const count = await markAllNotificationsAsRead('u-1');

      expect(count).toBe(0);
    });

    it('returns 0 when data is null', async () => {
      const chain = buildChain({ data: null, error: null });
      mockSupabaseSingle(chain);

      const count = await markAllNotificationsAsRead('u-1');

      expect(count).toBe(0);
    });

    it('throws on error', async () => {
      const chain = buildChain({ data: null, error: { message: 'update err' } });
      mockSupabaseSingle(chain);

      await expect(markAllNotificationsAsRead('u-1')).rejects.toThrow('update err');
    });
  });

  // =========================================================================
  // getPreferences
  // =========================================================================
  describe('getPreferences', () => {
    it('returns ordered preferences for a user', async () => {
      const prefs = [
        {
          user_id: 'u-1',
          org_id: 'org-1',
          in_app_enabled: true,
          email_enabled: true,
          email_digest: 'DAILY',
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];
      const chain = buildChain({ data: prefs, error: null });
      mockSupabaseSingle(chain);

      const result = await getPreferences('u-1');

      expect(result).toEqual(prefs);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('returns empty array when none exist', async () => {
      const chain = buildChain({ data: [], error: null });
      mockSupabaseSingle(chain);

      const result = await getPreferences('u-1');

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const chain = buildChain({ data: null, error: null });
      mockSupabaseSingle(chain);

      const result = await getPreferences('u-1');

      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      const chain = buildChain({ data: null, error: { message: 'pref error' } });
      mockSupabaseSingle(chain);

      await expect(getPreferences('u-1')).rejects.toThrow('pref error');
    });
  });

  // =========================================================================
  // getPreferenceForOrg
  // =========================================================================
  describe('getPreferenceForOrg', () => {
    it('returns preference for a specific org', async () => {
      const pref = {
        user_id: 'u-1',
        org_id: 'org-1',
        in_app_enabled: true,
        email_enabled: false,
        email_digest: 'NONE',
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      };
      const chain = buildChain({ data: pref, error: null });
      mockSupabaseSingle(chain);

      const result = await getPreferenceForOrg('u-1', 'org-1');

      expect(result).toEqual(pref);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(chain.eq).toHaveBeenCalledWith('org_id', 'org-1');
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('returns null when no preference found', async () => {
      const chain = buildChain({ data: null, error: null });
      mockSupabaseSingle(chain);

      const result = await getPreferenceForOrg('u-1', 'org-999');

      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      const chain = buildChain({ data: null, error: { message: 'org pref err' } });
      mockSupabaseSingle(chain);

      await expect(getPreferenceForOrg('u-1', 'org-1')).rejects.toThrow('org pref err');
    });
  });

  // =========================================================================
  // upsertPreference
  // =========================================================================
  describe('upsertPreference', () => {
    it('upserts a preference with onConflict user_id,org_id', async () => {
      const pref = {
        user_id: 'u-1',
        org_id: 'org-1',
        in_app_enabled: true,
        email_enabled: true,
        email_digest: 'WEEKLY',
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-09T10:00:00Z',
      };
      const chain = buildChain({ data: pref, error: null });
      mockSupabaseSingle(chain);

      const result = await upsertPreference('u-1', {
        orgId: 'org-1',
        inAppEnabled: true,
        emailEnabled: true,
        emailDigest: 'WEEKLY',
      });

      expect(result).toEqual(pref);
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u-1',
          org_id: 'org-1',
          in_app_enabled: true,
          email_enabled: true,
          email_digest: 'WEEKLY',
          updated_at: expect.any(String),
        }),
        { onConflict: 'user_id,org_id' }
      );
      expect(chain.single).toHaveBeenCalled();
    });

    it('throws on upsert error', async () => {
      const chain = buildChain({ data: null, error: { message: 'upsert fail' } });
      mockSupabaseSingle(chain);

      await expect(
        upsertPreference('u-1', {
          orgId: 'org-1',
          inAppEnabled: true,
          emailEnabled: true,
          emailDigest: 'DAILY',
        })
      ).rejects.toThrow('upsert fail');
    });
  });

  // =========================================================================
  // notifyOnPublish
  // =========================================================================
  describe('notifyOnPublish', () => {
    const publishedContent: IContent = {
      id: 'c-1',
      title: 'Campus Alert',
      body: 'Body content',
      slug: 'campus-alert',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      author_id: 'author-1',
      tags: [],
      scheduled_at: null,
      published_at: '2026-03-09T10:00:00Z',
      deleted_at: null,
      created_at: '2026-03-09T09:00:00Z',
      updated_at: '2026-03-09T10:00:00Z',
    };

    it('creates in-app notifications for all users except author', async () => {
      const users = [
        { id: 'u-1', email: 'u1@slu.edu' },
        { id: 'u-2', email: 'u2@slu.edu' },
      ];

      const usersChain = buildChain({ data: users, error: null });
      const prefsChain = buildChain({ data: [], error: null }); // No prefs → use defaults
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return usersChain;
          if (table === 'notification_preferences') return prefsChain;
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent);

      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'u-1',
            content_id: 'c-1',
            type: 'IN_APP',
            notification_text: 'New announcement: Campus Alert',
          }),
          expect.objectContaining({
            user_id: 'u-2',
            content_id: 'c-1',
            type: 'IN_APP',
          }),
        ])
      );
    });

    it('sends immediate emails when user pref is IMMEDIATE', async () => {
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];
      const prefs = [
        { user_id: 'u-1', in_app_enabled: true, email_enabled: true, email_digest: 'IMMEDIATE' },
      ];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          return buildChain({ data: null, error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent);

      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'u1@slu.edu',
          subject: 'New Announcement: Campus Alert',
        })
      );
    });

    it('skips email when user digest is DAILY (not IMMEDIATE)', async () => {
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];
      const prefs = [
        { user_id: 'u-1', in_app_enabled: true, email_enabled: true, email_digest: 'DAILY' },
      ];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          return buildChain({ data: null, error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent);

      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    it('skips in-app when user disabled it', async () => {
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];
      const prefs = [
        { user_id: 'u-1', in_app_enabled: false, email_enabled: true, email_digest: 'IMMEDIATE' },
      ];

      const insertChain = buildChain({ data: null, error: null });
      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent);

      // insert should NOT have been called with in-app rows
      expect(insertChain.insert).not.toHaveBeenCalled();
    });

    it('handles user fetch error gracefully', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const client = {
        from: jest.fn(() => buildChain({ data: null, error: { message: 'users fetch fail' } })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent); // should not throw

      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it('handles empty user list gracefully', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: [], error: null })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent); // should not throw

      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    it('logs error when notification insert fails', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: [], error: null });
          if (table === 'notifications')
            return buildChain({ data: null, error: { message: 'insert err' } });
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnPublish(publishedContent);

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to insert in-app notifications'),
        expect.any(String)
      );
      errSpy.mockRestore();
    });
  });

  // =========================================================================
  // notifyOnArticlePublish
  // =========================================================================
  describe('notifyOnArticlePublish', () => {
    const article = {
      id: 'art-1',
      title: 'Campus News Article',
      slug: 'campus-news',
      author_id: 'author-1',
    };

    it('creates in-app notifications for all users except author', async () => {
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: [], error: null });
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnArticlePublish(article);

      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'u-1',
            content_id: null, // articles use null content_id
            type: 'IN_APP',
            notification_text: 'New campus news: Campus News Article',
          }),
        ])
      );
    });

    it('sends immediate email for article publish', async () => {
      const users = [{ id: 'u-1', email: 'u1@slu.edu' }];
      const prefs = [
        { user_id: 'u-1', in_app_enabled: true, email_enabled: true, email_digest: 'IMMEDIATE' },
      ];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          return buildChain({ data: null, error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnArticlePublish(article);

      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'u1@slu.edu',
          subject: 'New Campus News: Campus News Article',
        })
      );
    });

    it('handles user fetch error gracefully', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const client = {
        from: jest.fn(() => buildChain({ data: null, error: { message: 'fail' } })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnArticlePublish(article);

      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it('handles empty user list', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: [], error: null })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnArticlePublish(article); // no throw
    });
  });

  // =========================================================================
  // notifyOnForumThread
  // =========================================================================
  describe('notifyOnForumThread', () => {
    const thread = {
      id: 'thread-1',
      title: 'New Discussion',
      slug: 'new-discussion',
      author_id: 'author-1',
    };

    it('creates in-app notifications for non-author users', async () => {
      const users = [{ id: 'u-1' }, { id: 'u-2' }];
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: [], error: null });
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumThread(thread);

      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'u-1',
            notification_text: 'New forum thread: New Discussion',
          }),
        ])
      );
    });

    it('respects user in_app_enabled=false preference', async () => {
      const users = [{ id: 'u-1' }];
      const prefs = [{ user_id: 'u-1', in_app_enabled: false }];
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumThread(thread);

      expect(insertChain.insert).not.toHaveBeenCalled();
    });

    it('does NOT send email for forum threads', async () => {
      const users = [{ id: 'u-1' }];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'users') return buildChain({ data: users, error: null });
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumThread(thread);

      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    it('handles fetch error gracefully', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const client = {
        from: jest.fn(() => buildChain({ data: null, error: { message: 'err' } })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumThread(thread);

      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it('handles empty user list', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: [], error: null })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumThread(thread); // no throw
    });
  });

  // =========================================================================
  // notifyOnForumReply
  // =========================================================================
  describe('notifyOnForumReply', () => {
    it('creates in-app notification for thread author', async () => {
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'notification_preferences') return buildChain({ data: [], error: null }); // default: in_app = true
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumReply({
        thread_id: 'thread-1',
        thread_title: 'Discussion',
        thread_author_id: 'author-1',
        reply_author_id: 'replier-1',
      });

      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'author-1',
          notification_text: 'New reply on your thread: Discussion',
        })
      );
    });

    it('does not notify when author replies to own thread', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: [], error: null })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumReply({
        thread_id: 'thread-1',
        thread_title: 'Discussion',
        thread_author_id: 'author-1',
        reply_author_id: 'author-1', // same person
      });

      // from() should not even be called since we return early
      expect(client.from).not.toHaveBeenCalled();
    });

    it('respects in_app_enabled=false preference', async () => {
      const prefs = [{ in_app_enabled: false }];
      const insertChain = buildChain({ data: null, error: null });

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'notification_preferences') return buildChain({ data: prefs, error: null });
          if (table === 'notifications') return insertChain;
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumReply({
        thread_id: 'thread-1',
        thread_title: 'Discussion',
        thread_author_id: 'author-1',
        reply_author_id: 'replier-1',
      });

      expect(insertChain.insert).not.toHaveBeenCalled();
    });

    it('logs error when insert fails', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'notification_preferences') return buildChain({ data: [], error: null });
          if (table === 'notifications')
            return buildChain({ data: null, error: { message: 'ins err' } });
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await notifyOnForumReply({
        thread_id: 'thread-1',
        thread_title: 'Discussion',
        thread_author_id: 'author-1',
        reply_author_id: 'replier-1',
      });

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to insert notification'),
        expect.any(String)
      );
      errSpy.mockRestore();
    });
  });

  // =========================================================================
  // getRecentPublishedContent
  // =========================================================================
  describe('getRecentPublishedContent', () => {
    it('returns digest items for content published since given date', async () => {
      const rows = [{ title: 'Alert', slug: 'alert', published_at: '2026-03-09T10:00:00Z' }];
      const chain = buildChain({ data: rows, error: null });
      mockSupabaseSingle(chain);

      const since = new Date('2026-03-08T00:00:00Z');
      const result = await getRecentPublishedContent(since);

      expect(result).toEqual([
        { title: 'Alert', slug: 'alert', publishedAt: '2026-03-09T10:00:00Z' },
      ]);
      expect(chain.eq).toHaveBeenCalledWith('status', 'PUBLISHED');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
      expect(chain.gte).toHaveBeenCalledWith('published_at', since.toISOString());
      expect(chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    });

    it('returns empty array when no results', async () => {
      const chain = buildChain({ data: [], error: null });
      mockSupabaseSingle(chain);

      const result = await getRecentPublishedContent(new Date());

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const chain = buildChain({ data: null, error: null });
      mockSupabaseSingle(chain);

      const result = await getRecentPublishedContent(new Date());

      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      const chain = buildChain({ data: null, error: { message: 'pub err' } });
      mockSupabaseSingle(chain);

      await expect(getRecentPublishedContent(new Date())).rejects.toThrow('pub err');
    });
  });

  // =========================================================================
  // getDigestRecipients
  // =========================================================================
  describe('getDigestRecipients', () => {
    it('returns emails for users with explicit WEEKLY preference', async () => {
      const explicitRows = [{ user_id: 'u-1' }];
      const emailRows = [{ email: 'u1@slu.edu' }];

      const client = {
        from: jest.fn((table: string) => {
          if (table === 'notification_preferences')
            return buildChain({ data: explicitRows, error: null });
          if (table === 'users') return buildChain({ data: emailRows, error: null });
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      const result = await getDigestRecipients('WEEKLY');

      expect(result).toEqual(['u1@slu.edu']);
    });

    it('includes users with no preferences for DAILY cadence', async () => {
      // 1st call: explicit prefs for DAILY → [u-1]
      // 2nd call: all pref user_ids → [u-1] (only u-1 has prefs)
      // 3rd call: all users → [u-1, u-2] (u-2 has no prefs)
      // 4th call: emails for [u-1, u-2]
      let prefCall = 0;
      const client = {
        from: jest.fn((table: string) => {
          if (table === 'notification_preferences') {
            prefCall++;
            if (prefCall === 1) return buildChain({ data: [{ user_id: 'u-1' }], error: null });
            return buildChain({ data: [{ user_id: 'u-1' }], error: null });
          }
          if (table === 'users') {
            // First users call: all users; second: email lookup
            return buildChain({
              data: [
                { id: 'u-1', email: 'u1@slu.edu' },
                { id: 'u-2', email: 'u2@slu.edu' },
              ],
              error: null,
            });
          }
          return buildChain({ data: [], error: null });
        }),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      const result = await getDigestRecipients('DAILY');

      // u-1 (explicit) + u-2 (no prefs, default DAILY)
      expect(result).toContain('u1@slu.edu');
      expect(result).toContain('u2@slu.edu');
    });

    it('returns empty array when no recipients', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: [], error: null })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      const result = await getDigestRecipients('WEEKLY');

      expect(result).toEqual([]);
    });

    it('throws on explicit prefs query error', async () => {
      const client = {
        from: jest.fn(() => buildChain({ data: null, error: { message: 'explicit err' } })),
      };
      mockedCreateClient.mockResolvedValue(client as never);

      await expect(getDigestRecipients('WEEKLY')).rejects.toThrow('explicit err');
    });
  });
});
