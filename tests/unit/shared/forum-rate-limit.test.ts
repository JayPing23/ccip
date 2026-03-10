/** @jest-environment node */

import {
  forumThreadCreateLimiter,
  forumReplyCreateLimiter,
  forumReportCreateLimiter,
} from '@/shared/utils/rate-limit';

describe('forum rate limiters', () => {
  it('forumThreadCreateLimiter allows up to 5 requests per minute', () => {
    // Use a fresh limiter to avoid cross-test state
    const key = `thread-test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(forumThreadCreateLimiter.check(key)).toBeNull();
    }
    expect(forumThreadCreateLimiter.check(key)).not.toBeNull();
  });

  it('forumReplyCreateLimiter allows up to 10 requests per minute', () => {
    const key = `reply-test-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(forumReplyCreateLimiter.check(key)).toBeNull();
    }
    expect(forumReplyCreateLimiter.check(key)).not.toBeNull();
  });

  it('forumReportCreateLimiter allows up to 5 reports per 5 minutes', () => {
    const key = `report-test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(forumReportCreateLimiter.check(key)).toBeNull();
    }
    expect(forumReportCreateLimiter.check(key)).not.toBeNull();
  });
});
