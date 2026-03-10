import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL ?? 'CCIP Notifications <notifications@ccip.app>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: options.from ?? DEFAULT_FROM,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(`Resend send error: ${error.message}`);
  }

  return { id: data?.id ?? '' };
}

export function buildPublishEmailHtml(title: string, slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ccip.app';
  const url = `${baseUrl}/content/${encodeURIComponent(slug)}`;

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">New Announcement Published</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5;">
        A new campus announcement has been published:
      </p>
      <p style="color: #111827; font-size: 18px; font-weight: 600;">
        ${escapeHtml(title)}
      </p>
      <a href="${url}"
         style="display: inline-block; margin-top: 12px; padding: 10px 20px;
                background-color: #2563eb; color: #ffffff; text-decoration: none;
                border-radius: 6px; font-size: 14px;">
        Read Announcement
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        You received this email because of your CCIP notification preferences.
      </p>
    </div>
  `.trim();
}

export interface DigestItem {
  title: string;
  slug: string;
  publishedAt: string;
}

export function buildDigestEmailHtml(items: DigestItem[], period: 'daily' | 'weekly'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ccip.app';
  const label = period === 'daily' ? 'Daily' : 'Weekly';

  const rows = items
    .map((item) => {
      const url = `${baseUrl}/content/${encodeURIComponent(item.slug)}`;
      return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="${url}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
            ${escapeHtml(item.title)}
          </a>
          <br />
          <span style="font-size: 12px; color: #9ca3af;">
            Published ${escapeHtml(item.publishedAt)}
          </span>
        </td>
      </tr>`;
    })
    .join('');

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">${label} Announcement Digest</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5;">
        Here are the announcements published since your last digest:
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
      <a href="${baseUrl}/feed"
         style="display: inline-block; margin-top: 16px; padding: 10px 20px;
                background-color: #2563eb; color: #ffffff; text-decoration: none;
                border-radius: 6px; font-size: 14px;">
        View All Announcements
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        You received this ${period} digest because of your CCIP notification preferences.
      </p>
    </div>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
