/** @jest-environment node */

import { GET as dailyGET } from '@/app/api/cron/digests/daily/route';
import { GET as weeklyGET } from '@/app/api/cron/digests/weekly/route';
import * as notificationsService from '@/modules/notifications/notifications.service';
import * as resend from '@/shared/lib/resend';

jest.mock('@/modules/notifications/notifications.service', () => ({
  getRecentPublishedContent: jest.fn(),
  getDigestRecipients: jest.fn(),
}));

jest.mock('@/shared/lib/resend', () => ({
  buildDigestEmailHtml: jest.fn().mockReturnValue('<html>digest</html>'),
  sendEmail: jest.fn().mockResolvedValue({ id: 'email-1' }),
}));

const mockedGetRecentPublishedContent = jest.mocked(notificationsService.getRecentPublishedContent);
const mockedGetDigestRecipients = jest.mocked(notificationsService.getDigestRecipients);
const mockedSendEmail = jest.mocked(resend.sendEmail);
const mockedBuildDigestEmailHtml = jest.mocked(resend.buildDigestEmailHtml);

const digestItems = [
  { title: 'Advisory', slug: 'advisory', publishedAt: '2026-03-09T12:00:00.000Z' },
];

function buildRequest(url: string, cronSecret?: string): Request {
  const headers: Record<string, string> = {};
  if (cronSecret) {
    headers.authorization = `Bearer ${cronSecret}`;
  }
  return new Request(url, { method: 'GET', headers });
}

describe('digest cron routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // --- Daily digest ---

  describe('GET /api/cron/digests/daily', () => {
    it('returns 401 when CRON_SECRET is set and auth header is wrong', async () => {
      process.env.CRON_SECRET = 'secret-123';

      const res = await dailyGET(buildRequest('http://localhost/api/cron/digests/daily', 'wrong'));
      expect(res.status).toBe(401);
    });

    it('returns sent=0 when no new content', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue([]);

      const res = await dailyGET(buildRequest('http://localhost/api/cron/digests/daily'));
      const body = await res.json();

      expect(body.sent).toBe(0);
      expect(body.reason).toMatch(/no new content/i);
    });

    it('returns sent=0 when no recipients', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue(digestItems);
      mockedGetDigestRecipients.mockResolvedValue([]);

      const res = await dailyGET(buildRequest('http://localhost/api/cron/digests/daily'));
      const body = await res.json();

      expect(body.sent).toBe(0);
      expect(body.reason).toMatch(/no daily digest recipients/i);
    });

    it('sends emails and returns count', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue(digestItems);
      mockedGetDigestRecipients.mockResolvedValue(['a@example.com', 'b@example.com']);
      mockedSendEmail.mockResolvedValue({ id: 'email-1' });

      const res = await dailyGET(buildRequest('http://localhost/api/cron/digests/daily'));
      const body = await res.json();

      expect(mockedGetDigestRecipients).toHaveBeenCalledWith('DAILY');
      expect(mockedBuildDigestEmailHtml).toHaveBeenCalledWith(digestItems, 'daily');
      expect(mockedSendEmail).toHaveBeenCalledTimes(2);
      expect(body.sent).toBe(2);
      expect(body.failed).toBe(0);
      expect(body.totalItems).toBe(1);
    });

    it('authorizes correctly when CRON_SECRET matches', async () => {
      process.env.CRON_SECRET = 'cron-pass';
      mockedGetRecentPublishedContent.mockResolvedValue([]);

      const res = await dailyGET(
        buildRequest('http://localhost/api/cron/digests/daily', 'cron-pass')
      );
      expect(res.status).toBe(200);
    });
  });

  // --- Weekly digest ---

  describe('GET /api/cron/digests/weekly', () => {
    it('returns 401 when CRON_SECRET is set and auth header is wrong', async () => {
      process.env.CRON_SECRET = 'secret-123';

      const res = await weeklyGET(
        buildRequest('http://localhost/api/cron/digests/weekly', 'wrong')
      );
      expect(res.status).toBe(401);
    });

    it('returns sent=0 when no new content', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue([]);

      const res = await weeklyGET(buildRequest('http://localhost/api/cron/digests/weekly'));
      const body = await res.json();

      expect(body.sent).toBe(0);
      expect(body.reason).toMatch(/no new content/i);
    });

    it('returns sent=0 when no recipients', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue(digestItems);
      mockedGetDigestRecipients.mockResolvedValue([]);

      const res = await weeklyGET(buildRequest('http://localhost/api/cron/digests/weekly'));
      const body = await res.json();

      expect(body.sent).toBe(0);
      expect(body.reason).toMatch(/no weekly digest recipients/i);
    });

    it('sends emails and returns count', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue(digestItems);
      mockedGetDigestRecipients.mockResolvedValue(['a@example.com']);
      mockedSendEmail.mockResolvedValue({ id: 'email-1' });

      const res = await weeklyGET(buildRequest('http://localhost/api/cron/digests/weekly'));
      const body = await res.json();

      expect(mockedGetDigestRecipients).toHaveBeenCalledWith('WEEKLY');
      expect(mockedBuildDigestEmailHtml).toHaveBeenCalledWith(digestItems, 'weekly');
      expect(mockedSendEmail).toHaveBeenCalledTimes(1);
      expect(body.sent).toBe(1);
      expect(body.failed).toBe(0);
    });

    it('reports failed emails correctly', async () => {
      mockedGetRecentPublishedContent.mockResolvedValue(digestItems);
      mockedGetDigestRecipients.mockResolvedValue(['a@example.com', 'b@example.com']);
      mockedSendEmail
        .mockResolvedValueOnce({ id: 'email-1' })
        .mockRejectedValueOnce(new Error('bounce'));

      const res = await weeklyGET(buildRequest('http://localhost/api/cron/digests/weekly'));
      const body = await res.json();

      expect(body.sent).toBe(1);
      expect(body.failed).toBe(1);
    });
  });
});
