# CCIP Phase 5 Plan

**Phase Name:** Unified Campus Platform Hardening
**Status:** Ready to Start
**Execution Model:** One micro-task per agent run
**Last Updated:** March 10, 2026

---

## Goal

Phase 5 turns the modular application into a mature campus platform by improving cross-module experience, analytics, lifecycle tooling, external distribution, and operational reliability.

This phase is deliberately **hardening and platform-maturity work**. It should refine the modules built in earlier phases without collapsing their boundaries.

---

## Phase 5 Definition Of Done

- unified homepage and cross-module navigation are mature
- analytics and reporting exist for the platform's core experiences
- retention and lifecycle tooling exist for managed content
- external distribution exists where it is justified for institutional or editorial content
- delivery retries, failure handling, and operational reliability are improved
- accessibility, performance, and security hardening passes are complete
- admin reporting and operational surfaces exist where needed
- docs and deployment references reflect the mature platform state

---

## Hard Constraints

- do not collapse announcements, publication, and forum into one generic domain module
- do not add new core product pillars in this phase
- do not externally distribute forum or user discussion content
- analytics and reporting must respect privacy, permissions, and role boundaries
- prefer additive hardening and targeted refactors over wide rewrites of stable modules
- one task ID per implementation pass

---

## Why Phase 5 Is Last

Platform hardening only makes sense once the major domain modules are already defined.

It comes last because:

- the homepage should reflect real modules, not placeholders,
- analytics should measure live module behavior rather than speculative designs,
- retention and lifecycle tooling depend on stable content models,
- external distribution and operations work should refine completed flows rather than shape unfinished ones.

---

## Milestone Order

### Milestone 0: Audit & Metrics Definition

Confirm what should be measured, hardened, or unified across the platform after Phases 1-4.

### Milestone 1: Unified Experience

Mature the homepage and cross-module navigation so the platform feels cohesive without erasing module boundaries.

### Milestone 2: Analytics & Reporting

Add analytics, reporting, and operational visibility for major platform workflows.

### Milestone 3: Retention & Lifecycle Tooling

Add retention rules, lifecycle tools, and administrative cleanup flows for managed content.

### Milestone 4: External Distribution

Add external publishing or distribution only where justified for institutional and editorial content.

### Milestone 5: Operational Hardening

Improve retry handling, cron reliability, failure visibility, accessibility, security, and performance.

### Milestone 6: Closeout

Add final tests, documentation updates, and release-readiness checks.

---

## Recommended File Targets

### Platform Experience & Analytics

- `app/(portal)/dashboard/page.tsx`
- `shared/components/Header.tsx`
- `modules/admin/analytics.service.ts`
- `modules/admin/types/analytics.types.ts`
- `app/api/admin/analytics/route.ts`

### Lifecycle & Retention

- `shared/utils/retention.ts`
- `app/api/admin/retention/route.ts`
- lifecycle admin UI entry files

### External Distribution

- `modules/external_publish/external_publish.service.ts`
- `modules/external_publish/types/index.ts`
- `app/api/external-publish/route.ts`
- `app/api/external-publish/[id]/route.ts`

### Operational Hardening

- `shared/lib/resend.ts`
- `shared/utils/rate-limit.ts`
- `app/api/cron/**`
- reliability or observability support files

---

## Verification Strategy

### Per Task

Use the verification command listed in `PHASE_5_AGENT_TASKS.md`.

### Per Milestone

Run:

- `npm run lint`
- `npm run type-check`
- `npm run test`

### Before Closing Phase 5

Run the full gate set:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run test:coverage`

---

## Recommended Starting Point

Start with `P5-01`.

Reason:

- it confirms which hardening work is truly Phase 5 versus leftover feature work,
- it prevents speculative analytics or distribution changes from reshaping stable modules,
- it turns Phase 5 into disciplined closeout work rather than a catch-all bucket.

---

## Phase 5 Exit Criteria

Phase 5 is complete only when:

1. the app feels like one coherent platform with explicit module boundaries,
2. analytics and lifecycle tooling support the real product workflows,
3. external distribution is limited to the right content types,
4. operational reliability and non-functional quality have been hardened,
5. the platform is documented and maintainable as a mature modular product.

---

*Phase 5 is polish, reliability, and platform maturity work. It is not a license to redesign the domain boundaries.*
