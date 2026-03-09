# CCIP API Reference

**Scope:** Current platform foundation and official announcements module
**Last Updated:** March 10, 2026

---

## Purpose

This document describes the API surface that exists for the current implementation boundary:

1. authentication and session-related flows,
2. users, roles, and organizations,
3. official announcements through the current `content` module,
4. basic admin stats.

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

Most resource-oriented routes follow the standardized `{ data, error }` shape. Some auth helper routes still expose a legacy `{ success, error }` structure and should be normalized in a later cleanup pass.

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

### `/api/users/*`

Supports current user-management and role-change flows used by the existing foundation.

### `/api/organizations/*`

Supports organization listing and update flows for the current institutional hierarchy.

---

## Planned Future Endpoint Families

These are intentionally separate from the current announcements API:

- `/api/notifications/*`
- `/api/search/*`
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
- `500` server error

---

## Documentation Rule

When new endpoint families are introduced for publication or forum work, update this file together with:

1. `CCIP_PROJECT_PROPOSAL.md`
2. `README.md`
3. `IMPLEMENTATION_LOG.md`

That keeps current implementation and future roadmap separated clearly.
