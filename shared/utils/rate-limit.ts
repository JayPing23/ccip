import { apiError } from '@/shared/utils/api-errors';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each limiter instance keeps a Map of request timestamps keyed by a caller
 * identifier (e.g. user ID or IP).  Old entries are pruned on every check so
 * memory stays bounded.
 *
 * NOTE: This is per-process.  In a multi-instance deployment (e.g. serverless)
 * each cold-start gets its own window.  For stricter guarantees, swap in a
 * Redis-backed store later without changing the call-site API.
 */

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

export function createRateLimiter({ limit, windowMs }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  /**
   * Check whether `key` is within the allowed rate.
   *
   * @returns `null` when the request is allowed, or a 429 `NextResponse` when
   *          the caller should be throttled.
   */
  function check(key: string) {
    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = store.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Prune timestamps outside the current window.
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
      return apiError('Too many requests. Please try again later.', 'RATE_LIMIT');
    }

    entry.timestamps.push(now);
    return null;
  }

  return { check };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for content mutation actions
// ---------------------------------------------------------------------------

/** Content creation: 10 requests per minute per user. */
export const contentCreateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

/** Content publish: 5 requests per minute per user. */
export const contentPublishLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});
