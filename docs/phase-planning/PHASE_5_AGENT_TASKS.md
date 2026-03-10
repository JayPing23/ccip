# CCIP Phase 5 Agent Tasks

**Purpose:** Break Phase 5 into small implementation units so hardening, analytics, and external distribution work improve the platform without dissolving the module boundaries established earlier.

**Status:** Ready to start

---

## How To Use This File

### Token Control Rules

- run one task ID per agent session
- do not combine analytics, lifecycle tooling, homepage unification, and operational hardening in one pass
- do not treat this file as a backlog for unfinished Phase 2-4 feature work
- use the listed files as the scope boundary
- if a blocker appears, stop and report it before the next task

### Standard Prompt Template

```text
Implement only task <TASK_ID> from docs/phase-planning/PHASE_5_AGENT_TASKS.md.

Scope:
- Follow the task's goal, file targets, and non-goals exactly.
- Do not start the next task.
- Touch only the listed files unless a small dependency fix is required.

Before finishing:
- Run the listed verification command.
- Summarize changed files, blockers, and the next recommended task.
```

---

## Task List

| ID | Goal | Likely Files | Depends On | Verify |
|---|---|---|---|---|
| `P5-01` | Audit cross-module hardening readiness, metrics needs, and operational gaps against the aligned roadmap | `CCIP_PROJECT_PROPOSAL.md`, `IMPLEMENTATION_LOG.md`, `app/(portal)/**`, `shared/**` | Phase 4 stable | `npm run type-check` |
| `P5-02` | Add analytics and lifecycle types/constants scaffolding only | `modules/admin/types/analytics.types.ts`, `shared/utils/retention.ts`, `shared/types/database.types.ts` | `P5-01` | `npm run type-check` |
| `P5-03` | Add additive analytics and retention schema migration | `supabase/migrations/**`, `shared/types/database.types.ts` | `P5-02` | `npm run type-check` |
| `P5-04` | Build analytics service and admin reporting endpoints | `modules/admin/analytics.service.ts`, `app/api/admin/analytics/route.ts`, admin integration files | `P5-03` | `npm run lint` |
| `P5-05` | Build a mature unified homepage and cross-module navigation experience | `app/(portal)/dashboard/page.tsx`, `shared/components/Header.tsx`, cross-module surfacing files | `P5-01` | `npm run lint` |
| `P5-06` | Build retention and lifecycle service methods for managed content | `shared/utils/retention.ts`, lifecycle integration files | `P5-03` | `npm run type-check` |
| `P5-07` | Add admin retention routes and lifecycle tooling UI | `app/api/admin/retention/route.ts`, lifecycle admin UI entry files | `P5-06` | `npm run lint` |
| `P5-08` | Build external distribution service for eligible institutional or editorial content only | `modules/external_publish/external_publish.service.ts`, `modules/external_publish/types/index.ts`, related integration files | `P5-01` | `npm run type-check` |
| `P5-09` | Add external distribution routes, retry handling, and status surfaces | `app/api/external-publish/route.ts`, `app/api/external-publish/[id]/route.ts`, external publish integration files | `P5-08` | `npm run lint` |
| `P5-10` | Perform platform-wide performance, accessibility, and security hardening for the core user journeys | shared and route files implicated by the hardening pass | `P5-05` | `npm run lint` |
| `P5-11` | Add cross-module tests and operational verification for analytics, lifecycle, and external distribution flows | `tests/integration/api/**`, `tests/unit/modules/**`, `tests/unit/shared/**` | `P5-10` | `npm run test` |
| `P5-12` | Update docs, env references, and implementation notes for the mature platform state | `IMPLEMENTATION_LOG.md`, `README.md`, `docs/API_REFERENCE.md`, `.env.example`, `docs/phase-planning/**` | `P5-11` | `npm run lint` |

---

## Non-Goals For This Task Pack

- no new domain module creation
- no collapse of announcements, publication, and forum into a shared content abstraction
- no external publishing of forum or user discussion content
- no unrelated feature backlog from earlier phases hidden inside “hardening” work
- no mobile app or LMS feature expansion

---

## Suggested First Three Runs

1. `P5-01` — audit hardening readiness and metrics needs
2. `P5-02` — add analytics and lifecycle scaffolding
3. `P5-03` — add analytics and retention schema

---

*Use this file only for Phase 5 hardening and platform maturity work.*
