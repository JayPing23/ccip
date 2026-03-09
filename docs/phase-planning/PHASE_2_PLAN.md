# CCIP Phase 2 Plan

**Phase Name:** Shared Discoverability, Notifications & Experience
**Status:** Planned
**Execution Model:** One micro-task per agent run
**Last Updated:** March 10, 2026

---

## Goal

Phase 2 strengthens the shared platform services that improve the current official announcements experience and prepare the codebase for the later publication module.

This phase is deliberately **shared-platform work**, not publication work and not forum work.

The point of Phase 2 is not just to improve announcements. It is to make shared discoverability, delivery, and experience patterns reusable across the future announcements, publication, and forum surfaces.

---

## Phase 2 Definition Of Done

- in-app notification center exists
- unread badge exists
- notification preferences exist
- immediate and digest email delivery exists
- search and filtering exist for the current announcements experience
- URL-driven filter state exists
- home/feed discoverability is improved
- rate limiting exists on high-risk content actions

---

## Hard Constraints

- additive database changes only
- no publication article schema yet
- no forum thread or reply schema yet
- no moderation runtime work yet
- do not overload the current `content` model with publication logic
- do not fake publication or forum runtime surfaces in the home/feed UI yet
- one task ID per implementation pass

---

## Why Phase 2 Exists Before Publication

Publication needs good platform services to feel complete:

- users need notification delivery,
- users need search and filters,
- the home experience needs stronger discoverability,
- the codebase needs shared patterns that later modules can reuse.

If publication is added before those shared services stabilize, the next module will duplicate logic and create drift.

---

## Milestone Order

### Milestone 0: Audit & Scaffolding

Confirm current notification/search readiness and add missing shared types/constants only.

### Milestone 1: In-App Notifications

Build listing, unread count, read flows, and notification UI.

### Milestone 2: Notification Preferences

Add per-organization preference management.

### Milestone 3: Search & Filters

Add search migration, search service, filter state, and feed integration.

### Milestone 4: Home/Feed Discoverability

Improve the dashboard or home surface so the announcements foundation already feels like a stronger front door for future modules without pretending the publication or forum modules are already implemented.

### Milestone 5: Email Delivery & Digests

Add immediate emails and scheduled digests.

### Milestone 6: Hardening & Closeout

Add rate limiting, targeted tests, and doc updates.

---

## Recommended File Targets

### Notifications

- `modules/notifications/notifications.service.ts`
- `modules/notifications/types/index.ts`
- `modules/notifications/hooks/useNotifications.ts`
- `modules/notifications/components/NotificationBell.tsx`
- `modules/notifications/components/NotificationCenter.tsx`
- `app/api/notifications/route.ts`
- `app/api/notifications/unread/route.ts`
- `app/api/notifications/[id]/read/route.ts`
- `app/api/notifications/preferences/route.ts`

### Search & Discoverability

- `modules/search/search.service.ts`
- `modules/search/types/index.ts`
- `modules/search/hooks/useSearchFilters.ts`
- `modules/search/components/SearchFilters.tsx`
- `app/api/search/route.ts`
- `app/(portal)/feed/page.tsx`
- `app/(portal)/dashboard/page.tsx`

### Shared Delivery / Hardening

- `shared/lib/resend.ts`
- `shared/utils/rate-limit.ts`
- `app/api/cron/digests/daily/route.ts`
- `app/api/cron/digests/weekly/route.ts`

---

## Verification Strategy

### Per Task

Use the verification command listed in `PHASE_2_AGENT_TASKS.md`.

### Per Milestone

Run:

- `npm run lint`
- `npm run type-check`
- `npm run test`

### Before Closing Phase 2

Run the full gate set:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run test:coverage`

---

## Recommended Starting Point

Start with `P2-01`.

Reason:

- it verifies current readiness,
- it prevents later tasks from assuming nonexistent shared scaffolding,
- it keeps the platform roadmap aligned with the new modular product direction.

---

## Phase 2 Exit Criteria

Phase 2 is complete only when:

1. the current announcements experience is measurably more discoverable,
2. notifications and preferences are usable,
3. shared search and filter infrastructure exists,
4. no publication or forum logic has been incorrectly merged into the announcements module,
5. the codebase is ready to begin the publication module,
6. the shared services introduced here are reusable by later platform modules rather than announcement-specific one-offs.

---

*Phase 2 is platform service work, not a shortcut into later modules.*
