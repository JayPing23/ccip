import type {
  NotificationCreateInput,
  NotificationDeliveryDecision,
  NotificationListItem,
  NotificationListParams,
  NotificationListResult,
  NotificationPreferenceInput,
  UnreadNotificationSummary,
} from '@/modules/notifications/types';
import { NOTIFICATION_DEFAULTS } from '@/modules/notifications/types';
import type { DigestItem } from '@/shared/lib/resend';
import { buildPublishEmailHtml, sendEmail } from '@/shared/lib/resend';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type {
  IContent,
  INotification,
  INotificationPreference,
} from '@/shared/types/database.types';

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

// ---------------------------------------------------------------------------
// Database-backed service methods
// ---------------------------------------------------------------------------

export async function listNotifications(
  params: NotificationListParams
): Promise<NotificationListResult> {
  const supabase = await createServerSupabaseClient();

  const page = params.page ?? 1;
  const pageSize = Math.min(
    params.pageSize ?? NOTIFICATION_DEFAULTS.PAGE_SIZE,
    NOTIFICATION_DEFAULTS.MAX_PAGE_SIZE
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notifications')
    .select('*, content:content_id(slug, title)', { count: 'exact' })
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const items: NotificationListItem[] = (data ?? []).map((row: Record<string, unknown>) => {
    const content = row.content as { slug: string; title: string } | null;
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      content_id: row.content_id as string | null,
      type: row.type as INotification['type'],
      notification_text: row.notification_text as string | null,
      read_at: row.read_at as string | null,
      created_at: row.created_at as string,
      content_slug: content?.slug ?? null,
      content_title: content?.title ?? null,
    };
  });

  const total = count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUnreadCount(userId: string): Promise<UnreadNotificationSummary> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'IN_APP')
    .is('read_at', null);

  if (error) throw new Error(error.message);

  const unreadCount = count ?? 0;

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

export async function createNotification(input: NotificationCreateInput): Promise<INotification> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      content_id: input.contentId ?? null,
      type: input.type,
      notification_text: input.notificationText,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as INotification;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<INotification> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as INotification;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
    .select('id');

  if (error) throw new Error(error.message);

  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export async function getPreferences(userId: string): Promise<INotificationPreference[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as INotificationPreference[];
}

export async function getPreferenceForOrg(
  userId: string,
  orgId: string
): Promise<INotificationPreference | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return (data as INotificationPreference) ?? null;
}

export async function upsertPreference(
  userId: string,
  input: NotificationPreferenceInput
): Promise<INotificationPreference> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        org_id: input.orgId,
        in_app_enabled: input.inAppEnabled,
        email_enabled: input.emailEnabled,
        email_digest: input.emailDigest,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,org_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as INotificationPreference;
}

// ---------------------------------------------------------------------------
// Publish-time notification fan-out
// ---------------------------------------------------------------------------

/**
 * Create in-app notifications and send immediate emails for a newly published
 * announcement.  Called from the publish API route after the content status
 * has transitioned to PUBLISHED.
 *
 * Sends to all users (except the author) whose notification preferences
 * allow it.  Users without explicit preferences receive both in-app and
 * immediate email (system default).
 */
export async function notifyOnPublish(content: IContent): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch all users except the author.
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email')
    .neq('id', content.author_id);

  if (usersErr) {
    console.error('[notifyOnPublish] Failed to fetch users:', usersErr.message);
    return;
  }

  if (!users || users.length === 0) return;

  // 2. Fetch all preferences keyed by user_id for quick lookup.
  const userIds = users.map((u: { id: string }) => u.id);
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, in_app_enabled, email_enabled, email_digest')
    .in('user_id', userIds);

  const prefMap = new Map<string, NotificationPreferenceSnapshot>();
  for (const p of prefs ?? []) {
    prefMap.set(p.user_id as string, {
      in_app_enabled: p.in_app_enabled as boolean,
      email_enabled: p.email_enabled as boolean,
      email_digest: p.email_digest as INotificationPreference['email_digest'],
    });
  }

  const notificationText = `New announcement: ${content.title}`;
  const inAppRows: Array<{
    user_id: string;
    content_id: string;
    type: 'IN_APP';
    notification_text: string;
  }> = [];
  const immediateEmailRecipients: string[] = [];

  for (const user of users as Array<{ id: string; email: string }>) {
    const decision = resolveNotificationDelivery(prefMap.get(user.id));

    if (decision.shouldCreateInApp) {
      inAppRows.push({
        user_id: user.id,
        content_id: content.id,
        type: 'IN_APP',
        notification_text: notificationText,
      });
    }

    if (decision.shouldSendEmail && decision.emailDigest === 'IMMEDIATE') {
      immediateEmailRecipients.push(user.email);
    }
  }

  // 3. Batch-insert in-app notifications.
  if (inAppRows.length > 0) {
    const { error: insertErr } = await supabase.from('notifications').insert(inAppRows);
    if (insertErr) {
      console.error('[notifyOnPublish] Failed to insert in-app notifications:', insertErr.message);
    }
  }

  // 4. Send immediate emails (fire-and-forget, errors logged).
  if (immediateEmailRecipients.length > 0) {
    const html = buildPublishEmailHtml(content.title, content.slug);

    // Send one email per recipient to avoid exposing addresses across users.
    await Promise.allSettled(
      immediateEmailRecipients.map((to) =>
        sendEmail({
          to,
          subject: `New Announcement: ${content.title}`,
          html,
        }).catch((err) => {
          console.error(`[notifyOnPublish] Email to ${to} failed:`, err);
        })
      )
    );
  }
}

// ---------------------------------------------------------------------------
// Digest helpers
// ---------------------------------------------------------------------------

/**
 * Return content published within a given window.
 * Used by both daily and weekly digest cron routes.
 */
export async function getRecentPublishedContent(since: Date): Promise<DigestItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('content')
    .select('title, slug, published_at')
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null)
    .gte('published_at', since.toISOString())
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: { title: string; slug: string; published_at: string }) => ({
    title: row.title,
    slug: row.slug,
    publishedAt: row.published_at,
  }));
}

export type DigestCadence = 'DAILY' | 'WEEKLY';

/**
 * Return email addresses of users whose preference matches the given cadence.
 *
 * A user qualifies when:
 *  - they have at least one notification_preferences row with
 *    email_enabled = true AND email_digest = cadence, OR
 *  - they have NO preference rows at all (system default is DAILY).
 */
export async function getDigestRecipients(cadence: DigestCadence): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  // Users who explicitly opted in to this cadence.
  const { data: explicitRows, error: explicitErr } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('email_enabled', true)
    .eq('email_digest', cadence);

  if (explicitErr) throw new Error(explicitErr.message);

  const explicitUserIds = new Set((explicitRows ?? []).map((r: { user_id: string }) => r.user_id));

  // For DAILY (the system default), also include users with no preferences at all.
  if (cadence === 'DAILY') {
    const { data: allPrefUserIds, error: allErr } = await supabase
      .from('notification_preferences')
      .select('user_id');

    if (allErr) throw new Error(allErr.message);

    const usersWithPrefs = new Set(
      (allPrefUserIds ?? []).map((r: { user_id: string }) => r.user_id)
    );

    const { data: allUsers, error: usersErr } = await supabase.from('users').select('id, email');

    if (usersErr) throw new Error(usersErr.message);

    for (const u of (allUsers ?? []) as Array<{ id: string; email: string }>) {
      if (!usersWithPrefs.has(u.id)) {
        explicitUserIds.add(u.id);
      }
    }
  }

  if (explicitUserIds.size === 0) return [];

  // Resolve emails for collected user IDs.
  const { data: emailRows, error: emailErr } = await supabase
    .from('users')
    .select('email')
    .in('id', [...explicitUserIds]);

  if (emailErr) throw new Error(emailErr.message);

  return (emailRows ?? []).map((r: { email: string }) => r.email);
}
