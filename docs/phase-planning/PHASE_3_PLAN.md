# CCIP Phase 3 Plan

**Phase Name:** Student Publication Module
**Status:** Complete
**Execution Model:** One micro-task per agent run
**Last Updated:** March 10, 2026

**Completion Note:** All Phase 3 definition-of-done items that match the implemented publication scope are present in the current repo state. This file remains as the record of the phase scope and boundaries.

---

## Goal

Phase 3 introduces a dedicated publication domain for campus journalism, feature stories, editorials, and section-based news coverage.

This phase must build a real editorial workflow on top of the shared platform services completed in Phase 2. It is deliberately **publication work**, not forum work and not a rewrite of the official announcements module.

---

## Phase 3 Definition Of Done

- additive publication tables exist
- article draft, review, approval, publish, and archive states exist
- writer and editor workflows exist
- category or section structure exists
- author bylines exist
- structured long-form article editing exists, with media-ready form scaffolding in place for a later upgrade
- Campus News listing and article detail pages exist
- homepage can surface publication separately from official announcements
- publication content integrates with shared notifications and search

---

## Hard Constraints

- additive database changes only
- do not store publication articles in the current `content` table
- do not merge publication routes into `/api/content/*`
- do not start forum categories, threads, replies, or moderation queue runtime here
- reuse shared notification, search, auth, and shell patterns instead of duplicating them inside publication
- one task ID per implementation pass

---

## Why Phase 3 Follows Phase 2

Publication is the first major additive domain module after the announcements foundation.

It depends on Phase 2 because:

- article publish flows benefit from shared notifications,
- Campus News discoverability needs shared search and home-surface patterns,
- publication should inherit stable shared shell and permission patterns,
- the codebase needs reusable platform services before the next domain grows.

---

## Milestone Order

### Milestone 0: Audit & Domain Framing

Confirm publication boundaries, workflow states, and the exact relationship between announcements and Campus News.

### Milestone 1: Publication Schema & Types

Add additive article tables, workflow states, and publication-specific types/constants.

### Milestone 2: Editorial Workflow Services

Build service-layer support for draft, review, approval, publish, and archive flows.

### Milestone 3: Publication API Surface

Add `/api/publication/*` routes for article CRUD and editorial workflow actions.

### Milestone 4: Editorial Authoring UI

Build article editing, review, and approval UI for writers and editors.

### Milestone 5: Campus News Reader Experience

Build listing and detail pages that clearly distinguish Campus News from official announcements.

### Milestone 6: Shared Integration

Connect publication to shared notifications, shared search, and homepage discoverability.

### Milestone 7: Hardening & Closeout

Add targeted tests, polish workflow edge cases, and update docs.

---

## Recommended File Targets

### Publication Domain

- `modules/publication/constants/index.ts`
- `modules/publication/types/index.ts`
- `modules/publication/publication.service.ts`
- `modules/publication/hooks/useArticleEditor.ts`
- `modules/publication/components/ArticleForm.tsx`
- `modules/publication/components/ArticleFeed.tsx`
- `modules/publication/components/PublicationWorkflowPanel.tsx`

### Publication API

- `app/api/publication/route.ts`
- `app/api/publication/[id]/route.ts`
- `app/api/publication/[id]/submit/route.ts`
- `app/api/publication/[id]/review/route.ts`
- `app/api/publication/[id]/publish/route.ts`

### Campus News Surfaces

- `app/(portal)/news/page.tsx`
- `app/(portal)/news/[slug]/page.tsx`
- `app/(portal)/news/create/page.tsx`
- `app/(portal)/news/[slug]/edit/page.tsx`
- `app/(portal)/dashboard/page.tsx`

---

## Verification Strategy

### Per Task

Use the verification command listed in `PHASE_3_AGENT_TASKS.md`.

### Per Milestone

Run:

- `npm run lint`
- `npm run type-check`
- `npm run test`

### Before Closing Phase 3

Run the full gate set:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run test:coverage`

---

## Recommended Next Step

Phase 3 is complete.

Recommended next step: start with `P4-01` in `docs/phase-planning/PHASE_4_AGENT_TASKS.md`.

Reason:

- publication boundaries are now proven in the repo structure and runtime,
- the next product pillar is moderated discussion and moderation tooling,
- forum work should inherit the shared services and additive-module pattern validated by Phase 3.

---

## Phase 3 Exit Criteria

Phase 3 is complete only when:

1. publication exists as a separate domain module from official announcements,
2. editorial workflow is real and enforceable,
3. Campus News has distinct reader-facing surfaces,
4. shared platform services are reused instead of duplicated,
5. the codebase is ready to begin the moderated forum module.

---

*Phase 3 adds a new domain module. It does not turn announcements into a generic content super-model.*
