import {
  getDigestRecipients,
  getRecentPublishedContent,
} from '@/modules/notifications/notifications.service';
import { buildDigestEmailHtml, sendEmail } from '@/shared/lib/resend';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/digests/daily
 *
 * Intended to be called by an external cron scheduler (e.g. Vercel Cron).
 * Collects announcements published in the last 24 hours and emails a digest
 * to every user whose notification preferences include DAILY email delivery.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: Request) {
  // Verify the request is from a trusted cron scheduler.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Determine the 24-hour window.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Fetch recently published content.
    const items = await getRecentPublishedContent(since);

    if (items.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No new content in the last 24 hours' });
    }

    // 3. Resolve daily-digest recipients.
    const recipients = await getDigestRecipients('DAILY');

    if (recipients.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No daily digest recipients' });
    }

    // 4. Build the digest email.
    const html = buildDigestEmailHtml(items, 'daily');
    const subject = `Your Daily Announcement Digest (${items.length} new)`;

    // 5. Send one email per recipient for privacy.
    const results = await Promise.allSettled(
      recipients.map((to) =>
        sendEmail({ to, subject, html }).catch((err) => {
          console.error(`[DailyDigest] Email to ${to} failed:`, err);
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed, totalItems: items.length });
  } catch (error) {
    console.error('[DailyDigest] Cron error:', error);
    return NextResponse.json({ error: 'Daily digest failed' }, { status: 500 });
  }
}
