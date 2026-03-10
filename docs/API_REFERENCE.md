# CCIP API Reference

**Scope:** Current platform foundation, official announcements, Phase 2 shared discoverability services, Phase 3 student publication module, and Phase 4 community forum & moderation\n**Last Updated:** March 10, 2026", "oldString": "**Scope:** Current platform foundation, official announcements, Phase 2 shared discoverability services, and Phase 3 student publication module\n**Last Updated:** March 10, 2026

---

## Purpose

This document describes the API surface that exists for the current implementation boundary:

1. authentication and session-related flows,
2. users, roles, and organizations,
3. official announcements through the current `content` module,
4. notifications, notification preferences, and search,
5. admin stats and digest cron utilities,
6. student publication through the `publication` module,
7. community forum through the `forum` module,
8. moderation through the `moderation` module.

Important rule:

`/api/content/*` is the official announcements API in the current codebase. Future publication and forum features should get their own endpoint families instead of being folded into `content`.

---

## Current Endpoint Families

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/setup-user`
- `POST /api/auth/callback/google`
- `GET /api/auth/oauth/callback`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Official Announcements

- `GET /api/content`
- `POST /api/content`
- `GET /api/content/[id]`
- `PATCH /api/content/[id]`
- `DELETE /api/content/[id]`
- `POST /api/content/[id]/publish`
- `POST /api/content/[id]/archive`
- `GET /api/content/manage`
- `GET /api/content/admin` (legacy compatibility alias)
- `GET /api/admin/content` (admin namespace alias)

Implementation notes:

- `GET /api/content?slug=...` is used for slug-based announcement lookup.
- `POST /api/content` and `POST /api/content/[id]/publish` use per-user rate limiting and may return `429` with the `RATE_LIMIT` error code.

### Notifications

- `GET /api/notifications`
  Query params: `page`, `pageSize`, `unreadOnly`
- `PATCH /api/notifications`
  Marks all unread notifications for the authenticated user as read.
- `GET /api/notifications/unread`
  Returns unread count summary for the authenticated user.
- `GET /api/notifications/preferences`
  Returns all saved per-organization notification preferences for the authenticated user.
- `PUT /api/notifications/preferences`
  Upserts a per-organization notification preference.
- `PATCH /api/notifications/[id]/read`
  Marks a single notification as read.

Implementation notes:

- Notification routes are authenticated and user-scoped.
- `GET /api/notifications` returns paginated data in the form `{ items, total, page, pageSize, totalPages }`.

### Search

- `GET /api/search`
  Query params: `q`, `status`, `visibility`, `tag`, `org`, `sort`, `page`, `pageSize`

Implementation notes:

- Search is backed by the additive `content.search_vector` full-text migration.
- The current public runtime scope searches published, non-deleted announcements.
- `sort=relevance` is part of the shared search contract, but the current implementation uses default published-date ordering after text filtering.

### Cron

- `GET /api/cron/digests/daily`
- `GET /api/cron/digests/weekly`

Implementation notes:

- These routes are intended for server-to-server schedulers, not interactive browser use.
- When `CRON_SECRET` is set, callers must send `Authorization: Bearer <CRON_SECRET>`.
- Digest routes return operational summaries such as `{ sent, failed, totalItems }` or `{ sent, reason }` rather than the standard `{ data, error }` resource wrapper.

### Users

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/[id]`
- `PATCH /api/users/[id]`
- `POST /api/users/[id]/role`

### Organizations

- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/[id]`
- `PATCH /api/organizations/[id]`

### Roles

- `GET /api/roles`

### Admin

- `GET /api/admin/stats`

---

## Response Format Rule

The preferred platform-wide response format is:

```typescript
// Success
{
  data: { ... },
  error: null,
}

// Error
{
  data: null,
  error: {
    message: 'Human-readable message',
    code: 'MACHINE_CODE',
  },
}
```

### Implementation Note

Most resource-oriented routes follow the standardized `{ data, error }` shape. Some auth helper routes still expose a legacy `{ success, error }` structure, and cron routes intentionally return direct operational summaries.

---

## Current Domain Mapping

### `/api/content/*`

Use this namespace only for official announcements.

Supported behaviors in the current implementation include:

- listing announcements,
- fetching a single announcement by slug with `GET /api/content?slug=...`,
- creating announcements,
- updating announcements,
- soft deleting announcements,
- publishing drafts,
- archiving content,
- editor-owned management listing through `/api/content/manage`,
- admin-compatible management aliases through `/api/content/admin` and `/api/admin/content`.

Important implementation note:

The management API is now owned by the announcements module. Admin pages may reuse that route, but the route is no longer the source of truth for announcement workflows.

### `/api/notifications/*`

Use this namespace for shared in-app notification state and per-organization delivery preferences.

### `/api/search`

Use this route for shared announcement search and URL-driven feed filtering.

### `/api/cron/digests/*`

Use these routes for scheduled email digests only. They are operational routes and should stay separate from interactive user-facing APIs.

### `/api/users/*`

Supports current user-management and role-change flows used by the existing foundation.

### `/api/organizations/*`

Supports organization listing and update flows for the current institutional hierarchy.

---

### Publication

- `GET /api/publication`
  Query params: `slug`, `managed`, `status`, `section`, `limit`, `offset`
  Returns published articles by default. Use `?slug=...` for single article lookup. Use `?managed=true` for editorial workspace (requires auth).
- `POST /api/publication`
  Creates a new article draft. Requires editor role. Rate-limited.
- `GET /api/publication/[id]`
  Returns article by ID.
- `PATCH /api/publication/[id]`
  Updates article fields.
- `DELETE /api/publication/[id]`
  Soft-deletes an article.
- `POST /api/publication/[id]/submit`
  Submits article for editorial review (DRAFT → IN_REVIEW).
- `POST /api/publication/[id]/review`
  Approves or requests revision for an article in review.
  Body: `{ action: 'approve' | 'request_revision', review_note?: string }`
- `POST /api/publication/[id]/publish`
  Publishes or archives an article.
  Body: `{ action: 'publish' | 'archive' }`

Implementation notes:

- Publication routes use the `articles` table, separate from announcements.
- Article creation and publish actions are rate-limited.
- Publishing an article triggers notification fan-out via `notifyOnArticlePublish`.

### Search (extended)

- `GET /api/search`
  Query params: `type` (default: `announcements`, optionally `articles` or `forum`), `q`, `section`, `status`, `visibility`, `tag`, `org`, `category_id`, `sort`, `page`, `pageSize`
  When `type=articles`, searches published articles by query and section.
  When `type=forum`, searches open forum threads by query and optional category.

### Forum

- `GET /api/forum/categories`
  Returns all forum categories ordered by display_order.
  Query params: `slug` (optional, returns single category)

- `GET /api/forum/threads`
  Query params: `category_id`, `page`, `pageSize`, `slug` (for single thread lookup)
  Lists threads in a category or fetches a single thread by slug.

- `POST /api/forum/threads`
  Creates a new forum thread. Requires authentication and forum posting permission. Rate-limited (5/min). Blocked for restricted users. Triggers notification fan-out.
  Body: `{ category_id, title, body }`

- `GET /api/forum/threads/[id]`
  Returns a single thread by ID.

- `PATCH /api/forum/threads/[id]`
  Updates a thread (owner or moderator). Body: `{ title?, body? }`

- `DELETE /api/forum/threads/[id]`
  Soft-deletes a thread (owner or moderator).

- `GET /api/forum/threads/[id]/reply`
  Lists replies for a thread.

- `POST /api/forum/threads/[id]/reply`
  Creates a reply. Requires authentication. Rate-limited (10/min). Blocked for restricted users. Locked threads reject replies. Triggers author notification.
  Body: `{ body, parent_reply_id? }`

- `GET /api/forum/threads/[id]/react`
  Query params: `reply_id` (optional)
  Returns aggregated reaction counts.

- `POST /api/forum/threads/[id]/react`
  Toggles a reaction. Body: `{ reaction_type, reply_id? }`

- `POST /api/forum/threads/[id]/report`
  Reports a thread or reply. Rate-limited (5/5min).
  Body: `{ reason, description?, reply_id? }`

Implementation notes:

- Forum routes use the `forum_threads`, `forum_replies`, and `forum_reactions` tables, separate from announcements and articles.
- Thread and reply creation are rate-limited and check for active user restrictions.
- Creating a thread triggers in-app notification fan-out to all users except the author.
- Creating a reply notifies the thread author via in-app notification.

### Moderation

- `GET /api/moderation/queue`
  Query params: `status`, `content_type` (optional filters)
  Returns the moderation report queue. Moderators only.

- `PATCH /api/moderation/queue`
  Reviews a report. Body: `{ report_id, status }`
  Moderators only.

- `GET /api/moderation/reports?id=`
  Returns a single report by ID. Moderators only.

- `GET /api/moderation/actions`
  Query params: `content_type`, `content_id`
  Lists moderation action history. Moderators only.

- `POST /api/moderation/actions`
  Creates a moderation action. Body: `{ content_type, content_id, action, reason, report_id? }`
  Moderators only.

- `GET /api/moderation/restrictions?user_id=`
  Returns active restrictions for a user. Moderators only.

- `POST /api/moderation/restrictions`
  Creates a restriction. Body: `{ user_id, restriction_type, reason, expires_at? }`
  Moderators only.

- `PATCH /api/moderation/restrictions`
  Revokes a restriction. Body: `{ restriction_id }`
  Moderators only.

Implementation notes:

- Moderation routes are restricted to users with the `canModerate` permission (university editors and super admins).
- Report statuses: PENDING, REVIEWED, DISMISSED, ACTIONED.
- Moderation action types: HIDE, LOCK, REMOVE, WARN.
- Restriction types: MUTED, SUSPENDED, BANNED.

## Planned Future Endpoint Families

These are intentionally separate from the existing APIs:

- `/api/external_publish/*`

---

## Status Codes

Preferred meanings:

- `200` success
- `201` created
- `400` malformed request
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `422` validation failure
- `429` rate limited
- `500` server error

---

## Documentation Rule

When current endpoint families change or new endpoint families are introduced, update this file together with:

1. `docs/CCIP_PROJECT_PROPOSAL.md`
2. `README.md`
3. `IMPLEMENTATION_LOG.md`

That keeps current implementation and future roadmap separated clearly.
