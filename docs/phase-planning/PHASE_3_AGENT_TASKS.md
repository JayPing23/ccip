# CCIP Phase 3 Agent Tasks

**Purpose:** Break Phase 3 into small implementation units so the publication module stays separate from announcements and reuses the shared platform work from earlier phases.

**Status:** Complete
**Completion Note:** This task pack is retained as the execution record for finished Phase 3 work. Do not continue from this file unless Phase 3 is being intentionally reopened.
**Next Recommended Entry Point:** `docs/phase-planning/PHASE_4_AGENT_TASKS.md` -> `P4-01`

---

## How To Use This File

### Token Control Rules

- run one task ID per agent session
- do not combine schema, workflow, UI, and integration work in one pass
- do not start forum or moderation runtime work from this file
- use the listed files as the scope boundary
- if a blocker appears, stop and report it before the next task

### Standard Prompt Template

```text
Implement only task <TASK_ID> from docs/phase-planning/PHASE_3_AGENT_TASKS.md.

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
| `P3-01` | Audit publication readiness, boundaries, and required reuse of Phase 2 shared services | `CCIP_PROJECT_PROPOSAL.md`, `docs/phase-planning/PHASE_2_PLAN.md`, `modules/content/**`, `shared/types/**` | Phase 2 stable | `npm run type-check` |
| `P3-02` | Add publication types, statuses, and constants scaffolding only | `modules/publication/constants/index.ts`, `modules/publication/types/index.ts`, `shared/types/database.types.ts` | `P3-01` | `npm run type-check` |
| `P3-03` | Add additive PostgreSQL publication schema migration for articles, sections, and workflow state | `supabase/migrations/**`, `shared/types/database.types.ts` | `P3-02` | `npm run type-check` |
| `P3-04` | Build publication service methods for article draft, review, publish, and archive flows | `modules/publication/publication.service.ts`, `modules/publication/types/index.ts` | `P3-03` | `npm run type-check` |
| `P3-05` | Add publication API routes for article listing, create, detail, and update | `app/api/publication/route.ts`, `app/api/publication/[id]/route.ts`, `modules/publication/publication.service.ts` | `P3-04` | `npm run lint` |
| `P3-06` | Add editorial workflow routes for submit, review, publish, and archive actions | `app/api/publication/[id]/submit/route.ts`, `app/api/publication/[id]/review/route.ts`, `app/api/publication/[id]/publish/route.ts`, `modules/publication/publication.service.ts` | `P3-05` | `npm run lint` |
| `P3-07` | Build article editor hook and local form workflow state | `modules/publication/hooks/useArticleEditor.ts`, `modules/publication/types/index.ts` | `P3-04` | `npm run type-check` |
| `P3-08` | Build article form UI with bylines, sections, workflow state, and media-ready structure | `modules/publication/components/ArticleForm.tsx`, `modules/publication/hooks/useArticleEditor.ts` | `P3-07` | `npm run lint` |
| `P3-09` | Build editorial workflow panel for writers and editors | `modules/publication/components/PublicationWorkflowPanel.tsx`, `app/(portal)/news/create/page.tsx`, `app/(portal)/news/[slug]/edit/page.tsx` | `P3-08` | `npm run lint` |
| `P3-10` | Build Campus News listing and article detail pages | `modules/publication/components/ArticleFeed.tsx`, `app/(portal)/news/page.tsx`, `app/(portal)/news/[slug]/page.tsx` | `P3-05` | `npm run lint` |
| `P3-11` | Add homepage surfacing for publication without mixing it into official announcements | `app/(portal)/dashboard/page.tsx`, `modules/publication/components/**`, `shared/components/Header.tsx` | `P3-10` | `npm run lint` |
| `P3-12` | Integrate article publish notifications through the shared notification layer | `modules/notifications/notifications.service.ts`, `modules/publication/publication.service.ts`, notification integration files | `P3-06` | `npm run lint` |
| `P3-13` | Extend shared search integration to publication content | `modules/search/search.service.ts`, `modules/publication/publication.service.ts`, search integration files | `P3-10` | `npm run lint` |
| `P3-14` | Add publication-focused tests for schema, workflow, routes, and reader flows | `tests/unit/modules/**`, `tests/integration/api/**`, `tests/unit/shared/**` | `P3-13` | `npm run test` |
| `P3-15` | Update docs and implementation notes for Phase 3 publication work | `IMPLEMENTATION_LOG.md`, `docs/API_REFERENCE.md`, `README.md`, `docs/phase-planning/**` | `P3-14` | `npm run lint` |

---

## Non-Goals For This Task Pack

- no forum categories, threads, replies, or moderation queue runtime
- no article storage inside the existing `content` table
- no fake publication support inside `/api/content/*`
- no external social distribution work yet
- no refactor that collapses announcements and publication into one generic content module

---

## Suggested First Three Runs

1. `P3-01` — audit publication readiness and boundaries
2. `P3-02` — add publication scaffolding
3. `P3-03` — add additive publication schema

---

*Use this file only for Phase 3 publication work.*
