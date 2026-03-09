# CCIP Phase 2 Agent Tasks

**Purpose:** Break Phase 2 into small implementation units so shared platform work stays controlled and does not drift into publication or forum scope.

---

## How To Use This File

### Token Control Rules

- run one task ID per agent session
- do not combine notifications, search, digests, and hardening in one pass
- do not start publication or forum work from this file
- use the listed files as the scope boundary
- do not add placeholder publication or forum runtime UI in Phase 2 tasks
- if a blocker appears, stop and report it before the next task

### Standard Prompt Template

```text
Implement only task <TASK_ID> from docs/phase-planning/PHASE_2_AGENT_TASKS.md.

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
| `P2-01` | Audit current notification, search, and home-surface readiness against the updated roadmap | `CCIP_PROJECT_PROPOSAL.md`, `modules/notifications/**`, `modules/search/**`, `app/(portal)/dashboard/**`, `shared/types/**` | None | `npm run type-check` |
| `P2-02` | Add shared notification/search/discoverability types and constants scaffolding only | `modules/notifications/types/index.ts`, `modules/search/types/index.ts`, `shared/types/database.types.ts` | `P2-01` | `npm run type-check` |
| `P2-03` | Build notification service methods for listing and unread count | `modules/notifications/notifications.service.ts`, `modules/notifications/types/index.ts` | `P2-02` | `npm run type-check` |
| `P2-04` | Add notification API routes for list, unread count, and mark-as-read | `app/api/notifications/route.ts`, `app/api/notifications/unread/route.ts`, `app/api/notifications/[id]/read/route.ts`, `modules/notifications/notifications.service.ts` | `P2-03` | `npm run lint` |
| `P2-05` | Add notification hook and bell badge with unread count | `modules/notifications/hooks/useNotifications.ts`, `modules/notifications/components/NotificationBell.tsx`, `shared/components/Header.tsx` | `P2-04` | `npm run lint` |
| `P2-06` | Build notification center UI and wire list/read flows | `modules/notifications/components/NotificationCenter.tsx`, `modules/notifications/hooks/useNotifications.ts`, `shared/components/Header.tsx` | `P2-05` | `npm run lint` |
| `P2-07` | Build notification preferences service and API route | `modules/notifications/notifications.service.ts`, `app/api/notifications/preferences/route.ts`, `modules/notifications/types/index.ts` | `P2-02` | `npm run lint` |
| `P2-08` | Build per-organization notification preferences UI | `modules/notifications/components/NotificationPreferences.tsx`, `app/(portal)/dashboard/page.tsx`, `modules/notifications/hooks/useNotifications.ts` | `P2-07` | `npm run lint` |
| `P2-09` | Add additive PostgreSQL full-text search migration for the current announcements module | `supabase/migrations/**`, `shared/types/database.types.ts` | `P2-01` | `npm run type-check` |
| `P2-10` | Build search service and `/api/search` route | `modules/search/search.service.ts`, `modules/search/types/index.ts`, `app/api/search/route.ts` | `P2-09` | `npm run lint` |
| `P2-11` | Create reusable URL-driven search/filter hook | `modules/search/hooks/useSearchFilters.ts`, `modules/search/types/index.ts` | `P2-10` | `npm run type-check` |
| `P2-12` | Add search and filter UI to the announcements feed | `modules/search/components/SearchFilters.tsx`, `app/(portal)/feed/page.tsx`, `modules/search/hooks/useSearchFilters.ts` | `P2-11` | `npm run lint` |
| `P2-13` | Improve the dashboard/home surface with clearer discoverability for current announcement content only, without inventing publication/forum runtime placeholders | `app/(portal)/dashboard/page.tsx`, `modules/content/components/**`, `shared/components/Header.tsx` | `P2-12` | `npm run lint` |
| `P2-14` | Add Resend client wrapper and immediate publish email delivery path | `shared/lib/resend.ts`, `modules/notifications/notifications.service.ts`, publish flow integration files | `P2-07` | `npm run lint` |
| `P2-15` | Add daily digest cron route and digest query logic | `app/api/cron/digests/daily/route.ts`, `modules/notifications/notifications.service.ts`, `shared/lib/resend.ts` | `P2-14` | `npm run lint` |
| `P2-16` | Add weekly digest cron route | `app/api/cron/digests/weekly/route.ts`, `modules/notifications/notifications.service.ts` | `P2-15` | `npm run lint` |
| `P2-17` | Add server-side rate limiting for content create/publish actions | `shared/utils/rate-limit.ts`, `app/api/content/route.ts`, `app/api/content/[id]/publish/route.ts` | `P2-04` | `npm run lint` |
| `P2-18` | Add targeted tests for notifications, search, digests, and rate limiting | `tests/integration/api/**`, `tests/unit/modules/**`, `tests/unit/shared/**` | `P2-17` | `npm run test` |
| `P2-19` | Update docs and implementation notes for completed Phase 2 work | `IMPLEMENTATION_LOG.md`, `docs/API_REFERENCE.md`, `README.md`, `.env.example` | `P2-18` | `npm run lint` |

---

## Non-Goals For This Task Pack

- no publication article workflow
- no article tables
- no forum categories, threads, or replies
- no moderation queue implementation
- no placeholder Campus News or Forum pages that imply those modules already run
- no refactor that turns the current announcement model into a shared content super-model

---

## Suggested First Three Runs

1. `P2-01` — audit and gap map
2. `P2-02` — add shared scaffolding
3. `P2-03` — notification read/query services

---

*Use this file only for Phase 2 shared platform work.*
