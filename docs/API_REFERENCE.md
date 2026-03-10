# CCIP API Reference

**Scope:** Current platform foundation, official announcements, and Phase 2 shared discoverability services
**Last Updated:** March 10, 2026

---

## Purpose

This document describes the API surface that exists for the current implementation boundary:

1. authentication and session-related flows,
2. users, roles, and organizations,
3. official announcements through the current `content` module,
4. notifications, notification preferences, and search,
5. admin stats and digest cron utilities.

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

## Planned Future Endpoint Families

These are intentionally separate from the current announcements API:

- `/api/publication/*`
- `/api/forum/*`
- `/api/moderation/*`

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
