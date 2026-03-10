/** @jest-environment node */

import { createRateLimiter } from '@/shared/utils/rate-limit';

describe('rate-limit', () => {
  describe('createRateLimiter', () => {
    it('allows requests within the limit', () => {
      const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });

      expect(limiter.check('user-1')).toBeNull();
      expect(limiter.check('user-1')).toBeNull();
      expect(limiter.check('user-1')).toBeNull();
    });

    it('blocks requests exceeding the limit', async () => {
      const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });

      limiter.check('user-1');
      limiter.check('user-1');

      const blocked = limiter.check('user-1');

      expect(blocked).not.toBeNull();

      const body = await blocked!.json();
      expect(blocked!.status).toBe(429);
      expect(body.error.message).toMatch(/too many requests/i);
    });

    it('tracks separate keys independently', () => {
      const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

      expect(limiter.check('user-1')).toBeNull();
      expect(limiter.check('user-2')).toBeNull();

      // user-1 is now blocked, user-2 is also blocked
      expect(limiter.check('user-1')).not.toBeNull();
      expect(limiter.check('user-2')).not.toBeNull();
    });

    it('resets after the window expires', () => {
      jest.useFakeTimers();

      const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

      expect(limiter.check('user-1')).toBeNull();
      expect(limiter.check('user-1')).not.toBeNull();

      // Advance past the window
      jest.advanceTimersByTime(1001);

      expect(limiter.check('user-1')).toBeNull();

      jest.useRealTimers();
    });

    it('prunes old timestamps on each check', () => {
      jest.useFakeTimers();

      const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });

      limiter.check('user-1'); // t=0
      jest.advanceTimersByTime(600);
      limiter.check('user-1'); // t=600

      // At t=600, both timestamps are in window => 2/2 used
      expect(limiter.check('user-1')).not.toBeNull();

      // Advance so t=0 entry falls out of window (t=1001)
      jest.advanceTimersByTime(401);

      // Now only t=600 entry remains in window => 1/2 used
      expect(limiter.check('user-1')).toBeNull();

      jest.useRealTimers();
    });
  });
});
