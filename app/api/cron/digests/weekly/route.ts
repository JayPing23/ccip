import {
  getDigestRecipients,
  getRecentPublishedContent,
} from '@/modules/notifications/notifications.service';
import { buildDigestEmailHtml, sendEmail } from '@/shared/lib/resend';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/digests/weekly
 *
 * Intended to be called by an external cron scheduler (e.g. Vercel Cron).
 * Collects announcements published in the last 7 days and emails a digest
 * to every user whose notification preferences include WEEKLY email delivery.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Determine the 7-day window.
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 2. Fetch recently published content.
    const items = await getRecentPublishedContent(since);

    if (items.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No new content in the last 7 days' });
    }

    // 3. Resolve weekly-digest recipients.
    const recipients = await getDigestRecipients('WEEKLY');

    if (recipients.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No weekly digest recipients' });
    }

    // 4. Build the digest email.
    const html = buildDigestEmailHtml(items, 'weekly');
    const subject = `Your Weekly Announcement Digest (${items.length} new)`;

    // 5. Send one email per recipient for privacy.
    const results = await Promise.allSettled(
      recipients.map((to) =>
        sendEmail({ to, subject, html }).catch((err) => {
          console.error(`[WeeklyDigest] Email to ${to} failed:`, err);
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed, totalItems: items.length });
  } catch (error) {
    console.error('[WeeklyDigest] Cron error:', error);
    return NextResponse.json({ error: 'Weekly digest failed' }, { status: 500 });
  }
}
