# CCIP Phase 4 Plan

**Phase Name:** Community Forum & Moderation
**Status:** Ready to Start
**Execution Model:** One micro-task per agent run
**Last Updated:** March 10, 2026

**Recommended Entry Point:** `docs/phase-planning/PHASE_4_AGENT_TASKS.md` -> `P4-01`

---

## Goal

Phase 4 introduces the moderated discussion layer of the platform.

This phase must create a real forum experience for institutional users while shipping moderation, reporting, rate limiting, and abuse controls as part of the same delivery. It is deliberately **forum and moderation work**, not a retrofit of the announcements or publication modules.

---

## Phase 4 Definition Of Done

- forum categories exist
- thread creation and reply flows exist
- reactions exist
- reporting flows exist
- moderation queue and moderator actions exist
- user restriction or suspension capability exists
- reply and mention notifications integrate with the shared notification layer
- forum content integrates with shared search where appropriate
- rate limiting and abuse protections are enforced
- moderator and admin tooling exist for ongoing forum operations

---

## Hard Constraints

- additive database changes only
- no anonymous posting in the initial forum implementation
- do not ship the forum without reporting and moderation queue support
- do not merge forum threads or replies into the announcements or publication tables
- reuse shared auth, notifications, search, and shell patterns instead of duplicating them inside forum code
- one task ID per implementation pass

---

## Why Phase 4 Follows Publication

Forum work has the highest operational risk of any domain module in the roadmap.

It follows publication because:

- discussion spaces need stronger platform maturity than editorial publishing,
- moderation must be explicit before community interaction is opened,
- shared notification and search patterns should already be stable,
- the codebase should already prove that a second domain module can be added cleanly before a higher-risk third one ships.

---

## Milestone Order

### Milestone 0: Audit & Safety Design

Confirm forum boundaries, moderation requirements, and abuse controls before schema work starts.

### Milestone 1: Forum Schema & Types

Add additive schema for categories, threads, replies, reactions, and forum-specific types/constants.

### Milestone 2: Moderation Schema & Services

Add report, moderation action, and user restriction models plus service-layer support.

### Milestone 3: Forum API Surface

Add `/api/forum/*` routes for categories, threads, replies, and reactions.

### Milestone 4: Moderation API Surface

Add `/api/moderation/*` routes for reports, queue review, moderator actions, and restrictions.

### Milestone 5: Forum Reader/Writer Experience

Build category, thread, reply, and reaction UI for institutional users.

### Milestone 6: Moderator Experience

Build moderation queue and action UI so moderators can operate the forum safely.

### Milestone 7: Shared Integration & Hardening

Connect forum work to shared notifications, shared search, rate limiting, and abuse protection.

### Milestone 8: Closeout

Add targeted tests, finalize operational guardrails, and update docs.

---

## Recommended File Targets

### Forum Domain

- `modules/forum/constants/index.ts`
- `modules/forum/types/index.ts`
- `modules/forum/forum.service.ts`
- `modules/forum/hooks/useForumThread.ts`
- `modules/forum/components/ForumCategoryList.tsx`
- `modules/forum/components/ThreadComposer.tsx`
- `modules/forum/components/ThreadView.tsx`

### Moderation Domain

- `modules/moderation/constants/index.ts`
- `modules/moderation/types/index.ts`
- `modules/moderation/moderation.service.ts`
- `modules/moderation/components/ModerationQueue.tsx`

### Forum & Moderation API

- `app/api/forum/categories/route.ts`
- `app/api/forum/threads/route.ts`
- `app/api/forum/threads/[id]/route.ts`
- `app/api/forum/threads/[id]/reply/route.ts`
- `app/api/forum/threads/[id]/react/route.ts`
- `app/api/forum/threads/[id]/report/route.ts`
- `app/api/moderation/reports/route.ts`
- `app/api/moderation/queue/route.ts`
- `app/api/moderation/actions/route.ts`
- `app/api/moderation/restrictions/route.ts`

### Forum Surfaces

- `app/(portal)/forum/page.tsx`
- `app/(portal)/forum/[category]/page.tsx`
- `app/(portal)/forum/thread/[slug]/page.tsx`

---

## Verification Strategy

### Per Task

Use the verification command listed in `PHASE_4_AGENT_TASKS.md`.

### Per Milestone

Run:

- `npm run lint`
- `npm run type-check`
- `npm run test`

### Before Closing Phase 4

Run the full gate set:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run test:coverage`

---

## Recommended Starting Point

Start with `P4-01`.

Reason:

- it forces the moderation and safety rules to be explicit before forum code begins,
- it prevents the team from building discussion first and moderation later,
- it keeps the forum module separate from announcements and publication from day one.

---

## Phase 4 Exit Criteria

Phase 4 is complete only when:

1. the forum exists as a separate domain module,
2. moderation tooling ships with the forum instead of after it,
3. rate limiting and abuse protections are enforceable,
4. shared notifications and search integrate cleanly where intended,
5. the codebase is ready for final platform hardening work.

---

*Phase 4 launches discussion only when moderation is already operational.*
