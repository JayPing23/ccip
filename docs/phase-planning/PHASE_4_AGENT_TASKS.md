# CCIP Phase 4 Agent Tasks

**Purpose:** Break Phase 4 into small implementation units so forum and moderation work stay safe, additive, and separate from earlier announcement and publication domains.

**Status:** Active next phase
**Dependency Note:** Phases 1-3 are complete in the current repo state.
**Recommended First Task:** `P4-01`

---

## How To Use This File

### Token Control Rules

- run one task ID per agent session
- do not combine schema, moderation, UI, and hardening work in one pass
- do not ship user discussion flows before moderation support exists
- use the listed files as the scope boundary
- if a blocker appears, stop and report it before the next task

### Standard Prompt Template

```text
Implement only task <TASK_ID> from docs/phase-planning/PHASE_4_AGENT_TASKS.md.

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
| `P4-01` | Audit forum and moderation readiness against the aligned roadmap and safety rules | `CCIP_PROJECT_PROPOSAL.md`, `docs/phase-planning/PHASE_3_PLAN.md`, `shared/types/**` | Phase 3 stable | `npm run type-check` |
| `P4-02` | Add forum and moderation types, statuses, and constants scaffolding only | `modules/forum/constants/index.ts`, `modules/forum/types/index.ts`, `modules/moderation/constants/index.ts`, `modules/moderation/types/index.ts`, `shared/types/database.types.ts` | `P4-01` | `npm run type-check` |
| `P4-03` | Add additive PostgreSQL forum schema migration for categories, threads, replies, and reactions | `supabase/migrations/**`, `shared/types/database.types.ts` | `P4-02` | `npm run type-check` |
| `P4-04` | Add additive moderation schema migration for reports, moderation actions, and user restrictions | `supabase/migrations/**`, `shared/types/database.types.ts` | `P4-02` | `npm run type-check` |
| `P4-05` | Build forum service methods for categories and thread lifecycle | `modules/forum/forum.service.ts`, `modules/forum/types/index.ts` | `P4-03` | `npm run type-check` |
| `P4-06` | Build reply and reaction service methods | `modules/forum/forum.service.ts`, `modules/forum/types/index.ts` | `P4-05` | `npm run type-check` |
| `P4-07` | Build moderation service methods for reports, queue review, actions, and restrictions | `modules/moderation/moderation.service.ts`, `modules/moderation/types/index.ts` | `P4-04` | `npm run type-check` |
| `P4-08` | Add forum API routes for categories, threads, replies, and reactions | `app/api/forum/categories/route.ts`, `app/api/forum/threads/route.ts`, `app/api/forum/threads/[id]/route.ts`, `app/api/forum/threads/[id]/reply/route.ts`, `app/api/forum/threads/[id]/react/route.ts` | `P4-06` | `npm run lint` |
| `P4-09` | Add reporting and moderation API routes | `app/api/forum/threads/[id]/report/route.ts`, `app/api/moderation/reports/route.ts`, `app/api/moderation/queue/route.ts`, `app/api/moderation/actions/route.ts`, `app/api/moderation/restrictions/route.ts` | `P4-07` | `npm run lint` |
| `P4-10` | Build forum hooks and local interaction state for thread, reply, and reaction flows | `modules/forum/hooks/useForumThread.ts`, `modules/forum/types/index.ts` | `P4-08` | `npm run type-check` |
| `P4-11` | Build forum listing, category, and thread UI | `modules/forum/components/ForumCategoryList.tsx`, `modules/forum/components/ThreadView.tsx`, `app/(portal)/forum/page.tsx`, `app/(portal)/forum/[category]/page.tsx`, `app/(portal)/forum/thread/[slug]/page.tsx` | `P4-10` | `npm run lint` |
| `P4-12` | Build composer, reply, and reaction UI for institutional users | `modules/forum/components/ThreadComposer.tsx`, `modules/forum/components/**`, `app/(portal)/forum/thread/[slug]/page.tsx` | `P4-11` | `npm run lint` |
| `P4-13` | Build moderation queue and moderator action UI | `modules/moderation/components/ModerationQueue.tsx`, moderation UI entry files | `P4-09` | `npm run lint` |
| `P4-14` | Integrate shared notifications and shared search for forum threads where appropriate | `modules/notifications/notifications.service.ts`, `modules/search/search.service.ts`, forum integration files | `P4-12` | `npm run lint` |
| `P4-15` | Add rate limiting and abuse protections for thread and reply creation | `shared/utils/rate-limit.ts`, `app/api/forum/**`, moderation integration files | `P4-09` | `npm run lint` |
| `P4-16` | Add forum and moderation tests for safety-critical flows | `tests/integration/api/**`, `tests/unit/modules/**`, `tests/unit/shared/**` | `P4-15` | `npm run test` |
| `P4-17` | Update docs and implementation notes for Phase 4 work | `IMPLEMENTATION_LOG.md`, `docs/API_REFERENCE.md`, `README.md`, `docs/phase-planning/**` | `P4-16` | `npm run lint` |

---

## Non-Goals For This Task Pack

- no anonymous posting
- no direct messaging or chat features
- no publication schema changes unrelated to forum integration points
- no external social distribution of forum content
- no forum launch without moderation queue, reports, and restriction tooling

---

## Suggested First Three Runs

1. `P4-01` — audit forum and moderation readiness
2. `P4-02` — add forum and moderation scaffolding
3. `P4-03` — add forum schema

---

*Use this file only for Phase 4 forum and moderation work.*
