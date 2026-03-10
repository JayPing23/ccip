# CCIP — Campus Communications & Interaction Platform
## Project Proposal & Developer Reference Guide
### Version 3.0 | Solo Developer | Zero-Budget | Portfolio + Campus Product

---

> PURPOSE OF THIS DOCUMENT
> This file is the architecture and product source of truth for CCIP. It is written for you, future collaborators, and AI coding assistants. It defines the platform vision, the current implementation boundary, the phased roadmap, and the rules that keep the codebase modular instead of collapsing into one oversized campus app.
>
> READ THIS BEFORE WRITING OR REFACTORING ANY FEATURE CODE.

---

## TABLE OF CONTENTS

1. Project Overview
2. Problem Statement
3. Product Vision
4. Target Users & Personas
5. Architecture Strategy
6. Technology Stack
7. Module Structure
8. Data Model Strategy
9. Roles, Identity & Permissions
10. Authentication & Identity Rules
11. Official Announcements Module
12. Student Publication Module
13. Community Forum Module
14. Notifications & Messaging Rules
15. Search, Filtering & Discoverability
16. Media & Rich Content
17. Moderation & Safety
18. Key Features Summary
19. Phased Development Plan
20. Testing Strategy
21. Non-Functional Requirements
22. API Design Rules
23. Naming Conventions
24. Coding Rules & Constraints
25. Project Management
26. Risks & Mitigation
27. Success Metrics
28. Strategic Advantages
29. Appendix: AI Assistant Usage Guide

---

## 1. Project Overview

**Project Name:** Campus Communications & Interaction Platform (CCIP)

**Type:** Full-stack web application

**Architecture:** Modular monolith

**Stack:** Next.js + TypeScript + Supabase + Vercel

**Budget:** Zero-cost / free-tier first

**Developer Model:** Solo developer, AI-assisted

**Current Implementation Reality:** Platform foundation + official announcements module are the current working scope

### What CCIP Is

CCIP is a unified campus platform with three product pillars under one application shell:

1. **Official Announcements**
   Trusted institutional updates from university, school, and department offices.
2. **Student Publication**
   Campus journalism, feature stories, editorials, and organization-led reporting.
3. **Community Forum**
   Moderated discussion spaces where students and faculty can raise concerns, react to campus issues, and exchange perspectives.

The platform exists to gather campus news and campus thought in one place without mixing every content type into one undifferentiated feed.

### What CCIP Is Not

- CCIP is not a generic social network.
- CCIP is not a replacement for an LMS such as Moodle or Canvas.
- CCIP is not a real-time chat app.
- CCIP is not a free-for-all anonymous forum.
- CCIP is not a single-table CMS where announcements, journalism, and discussions are treated as the same object.

### Product Principle

CCIP should feel like one platform to users, but internally it must stay modular.

The platform must never lose the distinction between:

- trusted institutional communication,
- editorially produced campus reporting, and
- open but moderated community discussion.

---

## 2. Problem Statement

### Current Campus Communication Problems

| Problem | Impact |
|---|---|
| Official announcements are fragmented across Facebook pages, group chats, department pages, and email blasts | Students miss important deadlines and notices |
| Student publication content is scattered or under-supported | Campus journalism has low reach and weak continuity |
| There is no structured, school-owned discussion space | Student and faculty concerns stay buried in private threads or external social media |
| Official, editorial, and discussion content are mixed informally | Trust, discoverability, and relevance all suffer |
| No consistent role system exists for editors, moderators, and administrators | Governance becomes ad hoc and insecure |
| No notification, search, or moderation workflow exists across the campus information ecosystem | The platform cannot scale safely |

### Root Cause

The campus lacks a single, structured digital platform that supports both trusted information distribution and responsible community participation.

---

## 3. Product Vision

### Primary Vision

Build one school web application that serves as:

1. the official destination for campus announcements,
2. the publishing home for student-led campus news, and
3. the moderated forum where the community can voice concerns and discuss campus issues.

### Product Goals

1. Centralize official campus communications.
2. Give student publications a first-class digital publishing workflow.
3. Provide a moderated venue for student and faculty voice.
4. Make campus information searchable, filterable, and easy to revisit.
5. Keep the product modular enough to build step by step.

### Non-Goals For Early Phases

- Native mobile app
- Direct messaging / private chat
- Learning management features such as quizzes, grades, submissions, or classrooms
- Marketplace or payments
- External social integrations before the core platform is stable

### Product Shape

The best framing is not “one giant school app.”

The right framing is:

**a unified campus news and community platform composed of separate modules.**

---

## 4. Target Users & Personas

### Persona 1: Student Reader

**Goal:** Stay informed about official notices, read campus stories, and participate in discussions.

**Needs:**
- clean home experience,
- organization-aware announcement feed,
- readable publication articles,
- safe discussion spaces,
- notifications for relevant updates.

### Persona 2: Faculty or Staff Member

**Goal:** Read official updates, understand student sentiment, and optionally participate in public campus discussions.

**Needs:**
- trusted official information,
- clear separation between official content and opinion,
- transparent moderation,
- institutional-authenticated identity.

### Persona 3: Department or University Editor

**Goal:** Publish official announcements quickly and accurately to the right audience.

**Needs:**
- role-based posting,
- multi-organization targeting,
- scheduled publishing,
- audit logs,
- reliable search and notification behavior.

### Persona 4: Publication Writer or Editor

**Goal:** Draft, review, and publish campus stories in a workflow that feels professional.

**Needs:**
- editorial review states,
- category/section support,
- bylines,
- rich text and media,
- homepage placement.

### Persona 5: Moderator / Super Admin

**Goal:** Keep the platform safe, govern permissions, and maintain operational visibility.

**Needs:**
- moderation queue,
- role assignment,
- report resolution,
- audit log access,
- organization management.

---

## 5. Architecture Strategy

### Architecture Choice: Modular Monolith

This is the correct architecture for CCIP because:

- one developer can ship it without distributed systems overhead,
- announcements, publication, and forum can share auth, search, notifications, and admin tooling,
- each module can evolve independently inside a single deployable app,
- it preserves future extraction paths if the product grows.

### Architecture Diagram

```text
Next.js Application (Single Deployment)
|
|-- app/                        App Router pages + API routes
|-- modules/
|   |-- auth/                   Login, sessions, domain validation
|   |-- users/                  Profiles, preferences, identity surfaces
|   |-- roles/                  RBAC and capability checks
|   |-- organizations/          University, school, department hierarchy
|   |-- content/                Current official announcements module
|   |-- notifications/          In-app + email delivery
|   |-- search/                 Shared search and filtering
|   |-- media/                  Uploads, attachments, storage
|   |-- admin/                  User, org, role, audit tooling
|   |-- publication/            Implemented Phase 3
|   |-- forum/                  Planned Phase 4
|   |-- moderation/             Planned Phase 4
|   `-- external_publish/       Planned Phase 5
|
|-- shared/                     Types, utils, constants, UI primitives, clients
|
`-- Supabase
    |-- Auth
    |-- PostgreSQL
    |-- Storage
    `-- Row Level Security
```

### Architectural Rules

1. Modules may import from `shared/`.
2. Modules may not directly depend on other domain modules unless the dependency is explicitly approved and documented.
3. Shared concerns belong in `shared/`, not in a dominant module.
4. Official announcements, publication articles, and forum threads must remain separate domain models.
5. The current `modules/content` implementation remains the source of truth for official announcements until additive publication/forum modules are introduced.

---

## 6. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js App Router | Server components, routing, SSR, API routes |
| Language | TypeScript strict mode | Type safety and AI-friendly code generation |
| Styling | Tailwind CSS | Fast responsive UI development |
| Database | Supabase PostgreSQL | Primary data store |
| Auth | Supabase Auth + Google OAuth | Institutional login |
| Storage | Supabase Storage | Media and file handling |
| Validation | Zod | Runtime request and form validation |
| Email | Resend | Notifications and digests |
| Editor | Tiptap | Rich text for publication and long-form content |
| Testing | Jest + React Testing Library + Cypress | Unit, integration, and E2E coverage |
| Hosting | Vercel | Deployment and cron execution |

### Why This Stack Still Works For The Broader Product

- Supabase covers auth, DB, storage, and RLS without extra infrastructure.
- Next.js supports modular UI surfaces and internal APIs in one codebase.
- TypeScript strict mode is essential once the product splits into more modules and more permission states.

---

## 7. Module Structure

### Current + Target Module Layout

```text
modules/
|-- auth/
|-- users/
|-- roles/
|-- organizations/
|-- content/           Current official announcements module
|-- notifications/
|-- search/
|-- media/
|-- admin/
|-- publication/       Implemented
|-- forum/             Planned
|-- moderation/        Planned
`-- external_publish/  Planned
```

### Shared Foundation Modules

These modules should exist before advanced product work:

1. `auth`
2. `users`
3. `roles`
4. `organizations`
5. `notifications`
6. `search`
7. `media`
8. `admin`
9. `moderation` (before forum launch)

### Domain Modules

1. `content`
   Current official announcements module, including announcement-specific schemas, constants, services, and editor workflows.
2. `publication`
   Campus journalism and editorial publishing.
3. `forum`
   Community discussion threads and replies.

### Current Implementation Boundary Notes

1. Editors manage official announcements from the content-owned workspace at `/content/manage`.
2. Admin oversight may reuse the same announcement module UI from `/admin/content`, but admin does not own announcement domain logic.
3. Shared services such as notifications and search are implemented Phase 2 runtime capabilities and should be reused by later modules instead of duplicated.

### UI Principle

Keep separate top-level experiences in the product shell:

1. Home
2. Announcements
3. Campus News
4. Forum
5. Organizations
6. Admin (authorized users only)

Do not collapse these into one mixed feed in the early phases.

---

## 8. Data Model Strategy

### Core Rule

Do not force all user-authored or editor-authored content into the current `content` table.

The current `content` table is the official announcements foundation. Publication and forum features must arrive as additive tables and modules.

### Current Foundation Tables

These are the existing base tables in the current codebase:

1. `roles`
2. `organizations`
3. `users`
4. `content`
5. `content_organizations`
6. `media_attachments`
7. `audit_logs`
8. `notifications`
9. `notification_preferences`
10. `content_external_targets`

### Planned Additive Tables

Publication module:

1. `articles`
2. `article_sections` or `publication_sections`
3. `article_revisions` or approval history table
4. `article_authors` if co-authoring is needed

Forum module:

1. `forum_categories`
2. `forum_threads`
3. `forum_replies`
4. `forum_reactions`

Moderation module:

1. `moderation_reports`
2. `moderation_actions`
3. `user_restrictions` or suspension table

### Shared Data Rules

1. Official announcements, articles, and forum threads should share authorship identity, tags/categories, notifications, and moderation surfaces where useful.
2. RLS must stay enabled on every table.
3. Additive migrations only for future phases.
4. Soft deletion stays the rule for institution-managed content.
5. Moderation actions should be auditable.

### Identity vs Authorization

Student, faculty, and staff are identity attributes.

Editor, moderator, and admin are authorization capabilities.

Do not confuse those two concepts in the schema.

---

## 9. Roles, Identity & Permissions

### Current System Roles

These remain the current implementation source of truth for the announcements foundation:

```typescript
export const ROLES = {
  STUDENT: 'STUDENT',
  DEPT_EDITOR: 'DEPT_EDITOR',
  UNIVERSITY_EDITOR: 'UNIVERSITY_EDITOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
```

### Planned Capability Expansion

When the publication and forum modules are introduced, avoid turning the `roles` table into a giant catch-all list unless there is a strong reason.

Preferred direction:

- keep global platform roles small,
- introduce module-specific memberships for publication and moderation,
- use capability checks instead of brittle role-string checks in UI code.

### Identity Types

Planned identity classification:

1. Student
2. Faculty
3. Staff

These are not the same thing as authorization roles.

### Capability Matrix (Target State)

| Capability | Student | Faculty/Staff | Dept Editor | Univ Editor | Publication Writer | Publication Editor | Moderator | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Read official announcements | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Publish official announcements | No | No | Own org only | Broad scope | No | No | No | Yes |
| Read publication articles | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Draft publication articles | No | Optional later | No | No | Yes | Yes | No | Yes |
| Publish publication articles | No | No | No | No | No | Yes | No | Yes |
| Create forum threads | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Moderate forum content | No | No | No | No | No | No | Yes | Yes |
| Manage users and orgs | No | No | No | No | No | No | No | Yes |

### Permission Rules

1. Use permission helper functions, never inline string checks in components.
2. Current implementation continues using the existing `ROLES` constants.
3. Publication and forum permissions must be introduced as additive capability checks, not ad hoc boolean fields in random tables.

---

## 10. Authentication & Identity Rules

### Authentication Model

- Provider: Google OAuth via Supabase Auth
- Scope: institutional accounts only
- Validation: server-side domain verification on every auth callback

### Rules

1. Never trust the client to declare its role.
2. Never trust the `hd` claim alone.
3. Always use `supabase.auth.getUser()` for protected server-side checks.
4. The current platform supports one institutional domain via `INSTITUTIONAL_DOMAIN`.
5. If the school eventually uses multiple domains or aliases, convert this env var to an allowlist in a later additive change.

### Identity Roadmap Notes

Future phases may add profile fields such as:

- affiliation type,
- course/department metadata,
- publication membership,
- moderation assignment.

These should be additive and should not break the current auth flow.

---

## 11. Official Announcements Module

### Purpose

This module is the trusted institutional communication layer.

### Current Backing Model

- `modules/content/`
- `content` table
- `content_organizations` table

### Current Runtime Boundary

- announcement validation and constants belong to `modules/content`, not `shared/`
- editor and admin announcement management reuse the same module-owned management surface
- portal detail routes are slug-based, while mutation APIs remain ID-based

### Announcement Rules

1. Only authorized editors and admins can create official announcements.
2. Announcements support multi-organization targeting.
3. Visibility remains server-enforced.
4. Soft delete only.
5. Audit logging is mandatory.

### Lifecycle

```text
DRAFT -> PUBLISHED
DRAFT -> SCHEDULED -> PUBLISHED
PUBLISHED -> ARCHIVED
ARCHIVED -> PUBLISHED
Any state -> soft deleted
```

### Why This Module Ships First

It delivers immediate user value, has the clearest permission model, and creates the technical foundation reused by later modules.

---

## 12. Student Publication Module

### Purpose

This module gives official student publication teams a real publishing home instead of treating journalism as a side note or as just another announcement.

### Content Types

Planned examples:

1. News
2. Feature
3. Opinion
4. Editorial
5. Sports
6. Culture

### Publication Workflow

```text
DRAFT -> IN_REVIEW -> READY_TO_PUBLISH -> PUBLISHED -> ARCHIVED
```

### Module Requirements

1. Articles must not live in the official announcements table.
2. Rich text and media are first-class concerns here.
3. Editorial review is required before publishing unless explicitly bypassed by a publication editor or super admin.
4. Author bylines and section/category support are required.
5. Homepage surfacing should distinguish publication content from official announcements.

### Why This Ships Before Forum

Publication adds depth without introducing the same moderation burden as open discussion.

---

## 13. Community Forum Module

### Purpose

This module allows students and faculty to voice concerns, discuss campus issues, and respond to institutional developments in a school-owned digital space.

### Forum Rules

1. Authenticated institutional users only.
2. No anonymous posting in the initial implementation.
3. Categories must exist before open thread creation.
4. Reporting and moderation must ship with the forum, not later.
5. Rate limiting and abuse controls are mandatory.

### Forum Capabilities

1. Create thread
2. Reply to thread
3. React to posts
4. Report content
5. Moderator hide / lock / remove actions

### Why This Ships After Publication

The forum is the highest operational-risk module. Once it launches, the team must handle spam, harassment, and policy enforcement.

---

## 14. Notifications & Messaging Rules

### Shared Notification Strategy

Notifications are a shared platform capability, not an announcements-only feature.

### Phased Scope

Phase 2 notification scope:

1. official announcement publish notifications,
2. unread badge,
3. per-organization preferences,
4. immediate + digest email rules.

Future notification scope:

1. article publish notifications,
2. forum reply or mention notifications,
3. moderator action notices.

### Rules

1. Bulk insert notification records when fan-out is needed.
2. Do not send notifications for drafts.
3. Use async email delivery.
4. Notification preferences must remain user-owned.

---

## 15. Search, Filtering & Discoverability

### Shared Search Direction

Search is also a shared platform capability.

### Near-Term Scope

Phase 2 search covers official announcements and prepares reusable filtering infrastructure.

### Future Scope

Later phases extend search to:

1. articles,
2. organization pages,
3. forum threads and optionally replies.

### Rules

1. Keep URL-driven filter state for shareability.
2. Do not index raw rich-text HTML without a clean extraction strategy.
3. Pagination is mandatory.
4. Search results should preserve content type labels in aggregated views.

---

## 16. Media & Rich Content

### Current State

Media infrastructure exists in the schema, but rich content and uploads should be introduced carefully.

### Product Rule

Official announcements can remain simpler earlier. Student publication is where rich text and stronger media handling become essential.

### Rules

1. Validate file type and size server-side.
2. Sanitize HTML server-side.
3. Keep public URLs and storage paths separate.
4. Do not expose service-role credentials.

---

## 17. Moderation & Safety

### Core Principle

Moderation is not optional forum polish. It is a launch requirement for any discussion feature.

### Minimum Moderation Capabilities Before Forum Launch

1. report content,
2. review queue,
3. hide / lock / remove actions,
4. reason codes,
5. user restriction capability,
6. audit trail for moderator actions.

### Safety Rules

1. Forum launch is blocked until moderation tools exist.
2. Rate limiting is required on thread and reply creation.
3. All moderation actions must be attributable to a real moderator or admin identity.

---

## 18. Key Features Summary

| Area | Feature | Phase |
|---|---|:---:|
| Foundation | Google OAuth with institutional restriction | 1 |
| Foundation | Organization hierarchy and RBAC | 1 |
| Announcements | Official announcement CRUD | 1 |
| Announcements | Multi-organization targeting | 1 |
| Announcements | Audit logging and visibility rules | 1 |
| Shared | Notifications and unread badge | 2 |
| Shared | Email digests and preferences | 2 |
| Shared | Search and URL-driven filters | 2 |
| Shared | Aggregated home experience foundation | 2 |
| Publication | Article workflow and bylines | 3 |
| Publication | Rich text, categories, media, featured stories | 3 |
| Forum | Threads, replies, reactions | 4 |
| Forum | Reports, moderation queue, restrictions | 4 |
| Platform | Analytics, retention, cross-posting, external distribution | 5 |

---

## 19. Phased Development Plan

### Phase 1 — Platform Foundation & Official Announcements

**Goal:** Ship the trusted institutional communications layer first.

**Definition of Done:**

- institutional auth works,
- current RBAC works,
- official announcement CRUD works,
- organization-scoped visibility works,
- audit logging works,
- admin basics work,
- tests cover the foundation.

**Current Status:** This is the implemented foundation the repo already centers on.

### Phase 2 — Shared Discoverability, Notifications & Experience

**Goal:** Strengthen the platform services that later modules will reuse.

**Definition of Done:**

- in-app notifications,
- unread badge,
- notification preferences,
- email digests,
- shared search/filter infrastructure,
- URL-driven discoverability,
- rate limiting,
- home/feed composition groundwork.

**Current Status:** Implemented. Notifications, preferences, search/filter infrastructure, digest routes, dashboard/feed discoverability, and rate limiting now exist as shared reusable platform services in the current repo state.

**Phase 2 DO NOT:**

- do not implement full publication workflow yet,
- do not launch forum threads yet,
- do not merge future-domain models into the current announcement table.

### Phase 3 — Student Publication Module

**Goal:** Add a real editorial publishing workflow.

**Definition of Done:**

- additive article tables exist,
- writer/editor workflow exists,
- structured article editing exists and the publication UI is media-ready for a later rich-text upgrade,
- article categories and bylines exist,
- article pages and listing pages exist,
- homepage can surface stories separately from official announcements.

### Phase 4 — Community Forum & Moderation

**Goal:** Launch structured campus discussion safely.

**Definition of Done:**

- forum categories, threads, and replies work,
- moderation queue and reports work,
- reaction and thread-lock flows work,
- rate limiting and abuse controls are in place,
- moderator and admin tooling exists.

### Phase 5 — Unified Campus Platform Hardening

**Goal:** Turn the modular app into a polished campus platform.

**Definition of Done:**

- unified homepage is mature,
- analytics exist,
- retention and content lifecycle tools exist,
- external distribution is implemented where justified,
- platform operations are hardened.

---

## 20. Testing Strategy

### Test Pyramid

1. Unit tests for shared utils, permissions, and module services.
2. Integration tests for API routes and service/database boundaries.
3. E2E tests for high-value user journeys.

### Required E2E Journeys By Module

Foundation + announcements:

1. login with institutional account,
2. read announcement feed,
3. create and publish announcement,
4. edit and archive announcement.

Publication:

1. writer drafts article,
2. editor reviews and publishes,
3. article appears in Campus News.

Forum:

1. user creates thread,
2. another user replies,
3. report flow works,
4. moderator action removes or locks content.

### Testing Rules

1. Mock external APIs.
2. Do not rely on client-only permission assumptions.
3. Add tests when a module boundary or permission rule changes.

---

## 21. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Type safety | TypeScript strict mode, zero `any` in maintained code |
| Unit coverage | At least 70% for service-layer and shared utility logic |
| Performance | Main portal views load within 3 seconds on standard connection |
| Security | Server-validated auth, RLS on all tables, sanitized input |
| Accessibility | Responsive and WCAG-aware UI, with stricter audit by publication/forum launch |
| Moderation readiness | No forum launch without report and moderator workflows |
| Documentation accuracy | Docs reflect current implemented scope and future roadmap separately |

---

## 22. API Design Rules

### Current Endpoint Families

These are the currently implemented or current-scope endpoint families:

- `/api/auth/*`
- `/api/content/*` for official announcements
- `/api/users/*`
- `/api/organizations/*`
- `/api/roles/*`

### Planned Endpoint Families

Future modules should use distinct namespaces:

- `/api/publication/*`
- `/api/forum/*`
- `/api/moderation/*`
- `/api/notifications/*`
- `/api/search/*`

### Rules

1. Do not overload `/api/content` to handle publication articles or forum threads.
2. Use Zod for input validation.
3. Use `PATCH` for partial updates.
4. Return standardized JSON responses:

```typescript
// Success
{ data: {...}, error: null }

// Error
{ data: null, error: { message: '...', code: '...' } }
```

5. Return 401 for unauthenticated, 403 for unauthorized, 404 for missing, and 422 for validation failures.
6. Use `/api/content/manage` as the canonical announcement management route; keep `/api/content/admin` and `/api/admin/content` as compatibility aliases only.

---

## 23. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `AnnouncementCard.tsx` |
| Hook | camelCase with `use` | `useNotifications.ts` |
| Service | module name + `.service.ts` | `content.service.ts` |
| Types file | `index.ts` or `*.types.ts` | `publication.types.ts` |
| API route | folder-based App Router `route.ts` | `app/api/forum/threads/route.ts` |

### Modules

Current module names:

- `content` = official announcements

Planned module names:

- `publication`
- `forum`
- `moderation`

Do not rename the current `content` module unless the refactor is intentional and documented.

---

## 24. Coding Rules & Constraints

### General Rules

1. Keep domain boundaries explicit.
2. Put business logic in services, not components.
3. Use shared permission helpers.
4. Keep publication and forum as additive modules.
5. Avoid speculative abstraction until the second module actually needs it.

### Data Model Rules

1. No schema rewrite that breaks Phase 1 behavior.
2. Future modules add tables; they do not repurpose the announcement schema blindly.
3. Every new table gets RLS.

### UI Rules

1. Separate official, editorial, and discussion surfaces in navigation and layout.
2. Do not visually style forum posts to look like official announcements.
3. Preserve content-type labeling anywhere aggregated content appears.

### Safety Rules

1. No forum without moderation.
2. No rich text storage without sanitization.
3. No external publishing without explicit phase approval.

---

## 25. Project Management

### Branch Strategy

```text
main
dev
feature/*
hotfix/*
```

### Documentation Requirements

These files must stay aligned:

1. `CCIP_PROJECT_PROPOSAL.md`
2. `README.md`
3. `IMPLEMENTATION_LOG.md`
4. `docs/API_REFERENCE.md`
5. phase planning files in `docs/phase-planning/`

### Planning Rule

Do not let roadmap docs claim a module exists before the implementation log and README make the current boundary explicit.

---

## 26. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| Scope creep from “whole school app” thinking | High | High | Keep module boundaries and phased roadmap strict |
| Forum abuse / harassment | High | High | Ship moderation before forum launch |
| Editorial workflow becomes muddled with announcements | Medium | High | Separate publication data model and routes |
| Role model grows too complex too early | Medium | Medium | Keep current global roles for foundation; add capability layers later |
| Search becomes noisy across different content types | Medium | Medium | Preserve content-type labels and separate indexes/queries as needed |
| Free-tier limits are exceeded | Low | Medium | Monitor and optimize before adding costly features |

---

## 27. Success Metrics

### Foundation Metrics

- official announcements are reliable and discoverable,
- zero auth bypass incidents,
- zero unlogged official content mutations,
- CI stays green.

### Publication Metrics

- consistent publishing cadence,
- article readership growth,
- editor approval workflow is used instead of bypassed.

### Forum Metrics

- active but manageable thread participation,
- low unresolved report backlog,
- acceptable abuse rate after moderation controls.

### Platform Metrics

- home usage across all modules,
- repeat weekly usage,
- meaningful cross-module engagement.

---

## 28. Strategic Advantages

| Advantage | Description |
|---|---|
| Stronger product story | More compelling than a simple announcement portal because it combines trusted information, journalism, and community voice |
| Modular delivery | Can be built step by step without pretending the whole platform ships at once |
| Real campus value | Solves communication, reach, and feedback problems together |
| Portfolio depth | Demonstrates auth, RBAC, editorial workflows, moderation, notifications, search, storage, and platform design |
| Extensible architecture | New modules can be added without rewriting the foundation |

---

## 29. Appendix: AI Assistant Usage Guide

### Working Rules For AI Tools

1. Treat the current `content` module as the official announcements module.
2. Do not implement publication or forum features inside the current announcement table or routes.
3. Before building a feature, identify whether it belongs to:
   - foundation/shared,
   - announcements,
   - publication,
   - forum,
   - moderation,
   - admin.
4. Respect the current phase.
5. Keep docs honest about current implementation versus planned scope.

### Quick Reference

- Current implemented core: auth, users, organizations, roles, official announcements, admin basics, tests.
- Next shared capabilities: notifications, search, discoverability.
- Next major module: publication.
- Forum comes only after moderation groundwork.

---

*Last updated: March 10, 2026 | Version 3.0 | CCIP — Campus Communications & Interaction Platform*
