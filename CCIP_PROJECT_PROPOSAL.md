# CCIP — Centralized Campus Information Portal
## Project Proposal & Developer Reference Guide
### Version 2.0 | Solo Developer | Zero-Budget | Portfolio + Commercial

---

> **PURPOSE OF THIS DOCUMENT**
> This file is the single source of truth for the CCIP project. It is written to be read by GitHub Copilot, AI coding assistants, and future developers (including yourself). Every section contains explicit rules, constraints, naming conventions, and architectural decisions so that AI tools can generate accurate, consistent code without hallucinating patterns that conflict with the project design.
>
> **READ THIS BEFORE WRITING ANY CODE.**

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users & Personas](#4-target-users--personas)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Folder & Module Structure](#7-folder--module-structure)
8. [Database Schema](#8-database-schema)
9. [User Roles & Permissions](#9-user-roles--permissions)
10. [Authentication Rules](#10-authentication-rules)
11. [Content Lifecycle](#11-content-lifecycle)
12. [Content Visibility Rules](#12-content-visibility-rules)
13. [Notification System](#13-notification-system)
14. [Rich Content & Media](#14-rich-content--media)
15. [Search, Filtering & Tagging](#15-search-filtering--tagging)
16. [External Social Media Posting](#16-external-social-media-posting)
17. [Key Features Summary](#17-key-features-summary)
18. [Phased Development Plan](#18-phased-development-plan)
19. [Testing Strategy](#19-testing-strategy)
20. [Non-Functional Requirements](#20-non-functional-requirements)
21. [API Design Rules](#21-api-design-rules)
22. [Naming Conventions](#22-naming-conventions)
23. [Coding Rules & Constraints (DOS and DON'TS)](#23-coding-rules--constraints-dos-and-donts)
24. [Project Management](#24-project-management)
25. [Risks & Mitigation](#25-risks--mitigation)
26. [Success Metrics](#26-success-metrics)
27. [Strategic Advantages](#27-strategic-advantages)

---

## 1. Project Overview

**Project Name:** Centralized Campus Information Portal (CCIP)
**Type:** Full-Stack Web Application
**Architecture:** Modular Monolith
**Stack:** Next.js + TypeScript + Supabase + Vercel
**Budget:** Zero (all free-tier services)
**Developer:** Solo
**Status:** Ideation / Pre-development

### What is CCIP?

CCIP is a secure, role-based web platform that centralizes all official university communications into one place. Students log in with their institutional Google account and see all announcements from their university, school, and department in a single feed. Administrators can create, edit, and delete announcements — posting once to reach multiple internal organizations and optionally cross-posting to external social media platforms.

### What CCIP is NOT

- CCIP is **not** a social network. Students cannot post content.
- CCIP is **not** a general-purpose CMS. It is purpose-built for university announcements.
- CCIP is **not** a replacement for email. It supplements email with a structured, searchable portal.
- CCIP is **not** a chat app. There is no real-time messaging between users.
- CCIP is **not** a public website. All content (except optionally configured public posts) requires authentication.

---

## 2. Problem Statement

### Current Challenges

| Problem | Impact |
|---|---|
| Students rely on Facebook groups, department sites, and messaging apps | High chance of missing important announcements |
| Admins manually post to multiple platforms | Time-consuming, error-prone, inconsistent |
| No standardized edit/delete workflow | Outdated info stays visible with no audit trail |
| No visibility rules — all content is visible to everyone | Irrelevant announcements cause noise and disengagement |
| No official notification system | Students must remember to check multiple sources |
| No search or filtering | Past announcements are impossible to find |
| No content lifecycle | No concept of draft, scheduled, or archived content |

### Root Cause

There is no single, trusted, structured source of truth for campus communications. Everything is informal and fragmented.

---

## 3. Goals & Objectives

### Primary Goals

1. Centralize all official communications into one secure portal
2. Eliminate admin duplication of effort across multiple platforms
3. Ensure students receive announcements relevant to their organization
4. Provide a proactive notification system so students don't have to remember to visit

### Secondary Goals

5. Build a clean, auditable content management workflow
6. Enable rich content: formatted text, images, PDFs
7. Support scheduled posting for planned announcements
8. Provide full-text search and filtering for discovery of past content
9. Enable optional cross-posting to external social media
10. Build a commercially extensible, white-labelable system

### Non-Goals (Explicitly Out of Scope)

- Real-time chat or messaging between users
- Student-generated content (no student posting in Phase 1–3)
- Integration with learning management systems (Moodle, Canvas, etc.)
- Mobile native app (web-only, responsive)
- Payment processing of any kind

---

## 4. Target Users & Personas

### Persona 1: Student (Default User)

**Name:** Maria, 2nd Year Computer Science Student
**Goal:** Stay informed about university events, deadlines, and department updates without checking five different apps
**Behavior:** Logs in 2–3 times per week. Prefers email digests over visiting the portal daily.
**Needs:** Clean feed, filtering by department, search for past announcements, email notifications for urgent posts
**Pain Points:** Misses announcements buried in Facebook groups. Gets irrelevant posts from departments she's not in.

### Persona 2: Department Admin (Editor)

**Name:** Admin Reyes, College of Engineering Secretary
**Goal:** Post department announcements quickly and reliably without duplicating effort
**Behavior:** Logs in daily. Creates 2–5 announcements per week. Needs to edit and archive old content.
**Needs:** Draft saving, scheduled posting, multi-org targeting, edit/delete with confirmation, audit history
**Pain Points:** Currently posts the same content to three different channels manually. Gets blamed when outdated info stays up.

### Persona 3: Super Admin

**Name:** IT Officer Santos
**Goal:** Manage the system, assign roles, onboard new organizations, monitor activity
**Behavior:** Logs in weekly. Handles edge cases: new department setup, role changes, content moderation.
**Needs:** Full admin dashboard, audit log viewer, user role management, organization management
**Pain Points:** No visibility into who posted what and when. Cannot revoke permissions easily.

---

## 5. System Architecture

### Architecture Type: Modular Monolith

A **modular monolith** is a single deployable application organized into independent, well-defined feature modules. This is the correct architecture for this project because:

- Solo developer: no need for microservices operational complexity
- Single Vercel + Supabase deployment: zero infrastructure cost
- Modules can be developed and tested independently
- Scales to multiple contributors in the future without rewrites
- AI tools (Copilot) perform better with consistent, predictable module structure

### Architecture Diagram

```
Next.js Application (Single Deployment on Vercel)
│
├── /app                          ← Next.js App Router
│   ├── /auth                     ← Google OAuth, session, domain restriction
│   ├── /users                    ← Profiles, settings, preferences
│   ├── /roles                    ← RBAC definitions, permission checks
│   ├── /organizations            ← University → School → Department hierarchy
│   ├── /content                  ← Announcements, articles, lifecycle
│   ├── /notifications            ← In-app alerts, email digest triggers
│   ├── /media                    ← File/image uploads via Supabase Storage
│   ├── /search                   ← Full-text search, filters, tags
│   ├── /external_publish         ← Facebook/Instagram Graph API (Phase 5)
│   ├── /admin                    ← Dashboard, audit logs, role management
│   └── /shared                   ← Types, utils, constants, UI components
│
├── Supabase (PostgreSQL + Auth + Storage + RLS)
│   ├── Authentication            ← Google OAuth session management
│   ├── Database                  ← All application data
│   ├── Storage                   ← Images, PDFs, attachments
│   └── Row Level Security        ← Data access control at DB level
│
└── External Services
    ├── Resend                    ← Transactional email (Phase 2)
    ├── Facebook Graph API        ← Cross-posting (Phase 5)
    └── Instagram Graph API       ← Cross-posting (Phase 5)
```

### Key Architectural Decisions & Rationale

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js App Router | SSR + SSG + API routes in one framework |
| Database | Supabase PostgreSQL | Free tier, RLS, auth, storage, real-time |
| Auth | Supabase Auth + Google OAuth | Institutional domain restriction, free |
| Hosting | Vercel | Free tier, auto-deploy from GitHub |
| Architecture | Modular Monolith | Solo developer, zero infra complexity |
| Language | TypeScript (strict mode) | Type safety, AI tool compatibility |
| Email | Resend | Simple API, generous free tier |

---

## 6. Technology Stack

### Full Stack Breakdown

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Next.js | 14+ (App Router) | UI rendering, routing, SSR/SSG |
| Language | TypeScript | 5+ strict mode | Type safety throughout |
| Styling | Tailwind CSS | 3+ | Utility-first responsive styling |
| Rich Text Editor | Tiptap | 2+ | Formatted announcement content |
| Database | Supabase PostgreSQL | Latest | Primary data store |
| Auth | Supabase Auth + Google OAuth | Latest | Institutional login |
| File Storage | Supabase Storage | Latest | Images, PDFs, attachments |
| ORM/Query | Supabase JS Client | v2 | Type-safe DB queries |
| Email | Resend | Latest | Transactional email, digests |
| Hosting | Vercel | Latest | Deployment, serverless functions |
| Testing (Unit) | Jest + React Testing Library | Latest | Component and service tests |
| Testing (E2E) | Cypress | Latest | Full user flow tests |
| CI/CD | GitHub Actions | Latest | Automated test + deploy pipeline |
| AI Assistance | GitHub Copilot | Latest | Code scaffolding and suggestions |

### Free Tier Limits (Stay Within These)

| Service | Free Tier Limit |
|---|---|
| Supabase DB | 500 MB storage, 2 GB bandwidth/month |
| Supabase Storage | 1 GB file storage |
| Supabase Auth | Unlimited users |
| Vercel | 100 GB bandwidth/month, 100 serverless function invocations/day |
| Resend | 3,000 emails/month, 100/day |

---

## 7. Folder & Module Structure

### Root Structure

```
/
├── app/                          ← Next.js App Router root
│   ├── (auth)/                   ← Route group: auth pages (login, callback)
│   ├── (portal)/                 ← Route group: authenticated app pages
│   └── api/                      ← API route handlers
├── modules/                      ← Feature modules (business logic)
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── organizations/
│   ├── content/
│   ├── notifications/
│   ├── media/
│   ├── search/
│   ├── external_publish/
│   └── admin/
├── shared/
│   ├── components/               ← Reusable UI components (Button, Modal, etc.)
│   ├── hooks/                    ← Shared React hooks
│   ├── types/                    ← Global TypeScript interfaces and types
│   ├── utils/                    ← Pure utility functions
│   ├── constants/                ← App-wide constants (roles, statuses, etc.)
│   └── lib/                      ← Configured clients (supabase, resend, etc.)
├── public/
│   └── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/                ← GitHub Actions CI/CD
├── supabase/
│   └── migrations/               ← SQL migration files
├── CCIP_PROJECT_PROPOSAL.md      ← THIS FILE
└── README.md
```

### Per-Module Structure

Every module follows this exact structure. No exceptions.

```
modules/content/
├── components/                   ← React UI components for this module only
│   ├── AnnouncementCard.tsx
│   ├── AnnouncementForm.tsx
│   └── AnnouncementFeed.tsx
├── api/                          ← Next.js API route handler functions
│   ├── create-content.ts
│   ├── update-content.ts
│   └── delete-content.ts
├── hooks/                        ← React hooks for this module
│   ├── useContent.ts
│   └── useContentForm.ts
├── types/                        ← TypeScript types for this module
│   └── content.types.ts
└── content.service.ts            ← All DB queries and business logic
```

### Module Dependency Rules

- Modules **may** import from `/shared`
- Modules **may NOT** import from other modules directly
- If two modules need shared logic, move it to `/shared`
- `content.service.ts` handles all DB interactions for the content module
- API routes call service functions, never query the DB directly

---

## 8. Database Schema

### Design Principles

- All tables use UUID primary keys (`gen_random_uuid()`)
- All tables have `created_at TIMESTAMPTZ DEFAULT NOW()`
- Soft deletion: use `deleted_at TIMESTAMPTZ NULL` — never hard delete content
- Audit everything: all mutations on `content` table are logged to `audit_logs`
- RLS (Row Level Security) is enabled on ALL tables — no exceptions
- Foreign keys are always declared explicitly with `ON DELETE` behavior specified

---

### Table: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role_id       UUID NOT NULL REFERENCES roles(id),
  org_id        UUID REFERENCES organizations(id),  -- primary organization (optional)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Rules:**
- `id` mirrors the Supabase Auth user ID — always the same UUID
- `role_id` is required. Default is STUDENT role on first login.
- `org_id` is the user's primary department/school. Used for notification defaults.
- `email` must match the institutional Google Workspace domain (enforced in auth flow)

---

### Table: `roles`

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,  -- STUDENT | DEPT_EDITOR | UNIVERSITY_EDITOR | SUPER_ADMIN
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed Data (run on first migration):**

```sql
INSERT INTO roles (name) VALUES
  ('STUDENT'),
  ('DEPT_EDITOR'),
  ('UNIVERSITY_EDITOR'),
  ('SUPER_ADMIN');
```

**Rules:**
- Role names are SCREAMING_SNAKE_CASE constants — never change these strings
- Do not add new roles without updating the permissions constants file
- Role assignment is done only by SUPER_ADMIN via the admin dashboard

---

### Table: `organizations`

```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,  -- URL-safe identifier e.g. "college-of-engineering"
  type        TEXT NOT NULL,         -- UNIVERSITY | SCHOOL | DEPARTMENT
  parent_id   UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Hierarchy Rules:**
- `UNIVERSITY` type has no parent (`parent_id = NULL`)
- `SCHOOL` type has a `UNIVERSITY` as parent
- `DEPARTMENT` type has a `SCHOOL` as parent
- Max depth: 3 levels (University → School → Department)
- Organizations are seeded by SUPER_ADMIN — they are NOT user-created

---

### Table: `content`

```sql
CREATE TABLE content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,          -- Rich text HTML from Tiptap editor
  author_id     UUID NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'DRAFT',
                -- DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  visibility    TEXT NOT NULL DEFAULT 'PUBLIC',
                -- PUBLIC | ORG_ONLY | DEPT_ONLY
  tags          TEXT[] DEFAULT '{}',    -- Array of tag strings
  slug          TEXT UNIQUE,            -- SEO-friendly URL slug (auto-generated)
  scheduled_at  TIMESTAMPTZ,            -- NULL if not scheduled
  published_at  TIMESTAMPTZ,            -- Set when status changes to PUBLISHED
  deleted_at    TIMESTAMPTZ,            -- NULL = not deleted (soft delete)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Rules:**
- `body` stores Tiptap-generated HTML — always sanitize on input with DOMPurify before saving
- `slug` is auto-generated from `title` on creation using a slugify utility — never manually set
- `deleted_at` is set on "delete" — never run `DELETE FROM content`
- `status` must only contain one of the four allowed values — validate server-side
- `scheduled_at` is only meaningful when `status = 'SCHEDULED'`
- `published_at` is set automatically when status transitions to `PUBLISHED`

---

### Table: `content_organizations`

```sql
CREATE TABLE content_organizations (
  content_id   UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, org_id)
);
```

**Rules:**
- This is the junction table for multi-organization posting
- One content item can belong to multiple organizations
- When querying content for a user, join through this table filtered by the user's `org_id` (and parent orgs)
- When an admin selects "All Organizations," insert one row per organization

---

### Table: `media_attachments`

```sql
CREATE TABLE media_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,           -- Supabase Storage public URL
  storage_path TEXT NOT NULL,           -- Internal Supabase Storage path (for deletion)
  file_type    TEXT NOT NULL,           -- IMAGE | PDF | FILE
  file_name    TEXT NOT NULL,
  file_size    INTEGER NOT NULL,        -- Size in bytes
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Rules:**
- When content is deleted (soft delete), do NOT delete attachments immediately — keep for audit
- When content is permanently purged (future admin feature), delete from Supabase Storage first using `storage_path`, then delete the row
- `url` is the public Supabase Storage URL — generated after upload
- Max file sizes are enforced in the API (not just the UI): Images ≤ 5 MB, PDFs ≤ 20 MB

---

### Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   UUID REFERENCES content(id) ON DELETE SET NULL,
  actor_id     UUID NOT NULL REFERENCES users(id),
  action       TEXT NOT NULL,     -- CREATE | EDIT | DELETE | PUBLISH | ARCHIVE | RESTORE
  diff         JSONB,             -- Snapshot of changes: { before: {...}, after: {...} }
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Rules:**
- Every mutation to the `content` table MUST write to `audit_logs` — no exceptions
- `diff` stores a JSON object with `before` and `after` fields containing the full content snapshot
- Audit logs are NEVER deleted — they are permanent records
- Do not expose raw `audit_logs` to non-admin users

---

### Table: `notifications`

```sql
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id   UUID REFERENCES content(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,   -- IN_APP | EMAIL
  message      TEXT NOT NULL,
  read_at      TIMESTAMPTZ,     -- NULL = unread
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table: `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_digest   TEXT NOT NULL DEFAULT 'DAILY',   -- IMMEDIATE | DAILY | WEEKLY | NONE
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, org_id)
);
```

**Rules:**
- Default preferences are created on first login for all organizations the user belongs to
- Users can update their own preferences only — enforced via RLS
- SUPER_ADMIN cannot override individual user preferences

---

### Table: `content_external_targets`

```sql
CREATE TABLE content_external_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,    -- FACEBOOK | INSTAGRAM
  external_post_id TEXT,            -- ID returned by the platform API after posting
  status          TEXT NOT NULL DEFAULT 'PENDING',
                  -- PENDING | PUBLISHED | FAILED | DELETED
  error_log       TEXT,             -- Error message if status = FAILED
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. User Roles & Permissions

### Role Definitions

```typescript
// shared/constants/roles.ts
// DO NOT change these string values — they are stored in the database

export const ROLES = {
  STUDENT:            'STUDENT',
  DEPT_EDITOR:        'DEPT_EDITOR',
  UNIVERSITY_EDITOR:  'UNIVERSITY_EDITOR',
  SUPER_ADMIN:        'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

### Permission Matrix

| Permission | STUDENT | DEPT_EDITOR | UNIVERSITY_EDITOR | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| Read published announcements | ✅ | ✅ | ✅ | ✅ |
| Search and filter content | ✅ | ✅ | ✅ | ✅ |
| Receive notifications | ✅ | ✅ | ✅ | ✅ |
| Manage own notification preferences | ✅ | ✅ | ✅ | ✅ |
| Create department announcements | ❌ | ✅ (own dept only) | ✅ | ✅ |
| Create university-wide announcements | ❌ | ❌ | ✅ | ✅ |
| Edit own content | ❌ | ✅ | ✅ | ✅ |
| Edit any content | ❌ | ❌ | ❌ | ✅ |
| Delete own content (soft) | ❌ | ✅ | ✅ | ✅ |
| Delete any content (soft) | ❌ | ❌ | ❌ | ✅ |
| Upload media attachments | ❌ | ✅ | ✅ | ✅ |
| Schedule posts | ❌ | ✅ | ✅ | ✅ |
| Multi-org posting | ❌ | ✅ (own dept only) | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ❌ | ✅ |
| Manage organizations | ❌ | ❌ | ❌ | ✅ |
| Cross-post to social media | ❌ | ❌ | ✅ | ✅ |

### Role Assignment Rules

1. **All new users** default to `STUDENT` role on first login — enforced in the `handle_new_user` Supabase trigger
2. **SUPER_ADMIN** is the only role that can assign or change roles
3. **Role changes** are logged in `audit_logs` with `action = 'ROLE_CHANGE'`
4. **Role changes** take effect on the next user session — no immediate session invalidation required for Phase 1
5. **Revoking access:** downgrade the user's role to `STUDENT` — never delete the user record

### Permission Check Pattern

```typescript
// shared/utils/permissions.ts
// Use this pattern for ALL permission checks — never inline role string comparisons

import { ROLES, Role } from '@/shared/constants/roles';

export function canCreateContent(role: Role): boolean {
  return [ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN].includes(role);
}

export function canManageRoles(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canEditAnyContent(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

// Pattern: always use these functions, never compare role strings directly in components or API routes
```

---

## 10. Authentication Rules

### Google OAuth Configuration

- **Provider:** Google OAuth 2.0 via Supabase Auth
- **Domain Restriction:** The `hd` (hosted domain) parameter is set to the institutional domain (e.g., `university.edu.ph`)
- **Double validation:** Domain is checked BOTH in the OAuth flow (via `hd` param) AND server-side in the auth callback before creating the user session
- **Why double validation:** The `hd` parameter alone can be bypassed by a crafted OAuth token. Server-side validation is the real security gate.

### Auth Flow

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth with hd=institutional-domain
3. Google returns auth code
4. Supabase Auth callback receives the code
5. SERVER-SIDE: Extract email from token, verify domain matches INSTITUTIONAL_DOMAIN env var
6. If domain mismatch → reject, redirect to /login?error=unauthorized_domain
7. If domain matches → create or update user in public.users table
8. Set default STUDENT role if new user
9. Redirect to /dashboard
```

### Environment Variables Required

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only — never expose client-side
INSTITUTIONAL_DOMAIN=university.edu.ph   # The allowed Google Workspace domain
RESEND_API_KEY=                   # Phase 2
FACEBOOK_APP_ID=                  # Phase 5
FACEBOOK_APP_SECRET=              # Phase 5
```

### Auth Rules & Constraints

- **DO** validate the user's email domain server-side on every auth callback
- **DO NOT** trust the `hd` claim from the OAuth token alone
- **DO NOT** expose `SUPABASE_SERVICE_ROLE_KEY` in any client-side code
- **DO NOT** use the service role key in React components or hooks — only in Next.js server-side code
- **DO** use the Supabase anon key in client-side code with RLS as the security layer
- **DO** create a Supabase Auth trigger to auto-insert into `public.users` on new user creation
- **DO NOT** manually insert into `auth.users` — always let Supabase Auth handle this

---

## 11. Content Lifecycle

### Status Flow

```
DRAFT → PUBLISHED
DRAFT → SCHEDULED → PUBLISHED (auto, via cron or Vercel cron job)
PUBLISHED → ARCHIVED
ARCHIVED → PUBLISHED (restore)
Any status → soft-deleted (deleted_at is set, status unchanged)
```

### Status Rules

| Status | Visible to Students | Editable | Deletable |
|---|:---:|:---:|:---:|
| DRAFT | ❌ | ✅ | ✅ |
| SCHEDULED | ❌ | ✅ | ✅ |
| PUBLISHED | ✅ | ✅ | ✅ |
| ARCHIVED | ❌ (unless admin) | ✅ | ✅ |
| Soft-deleted | ❌ | ❌ | ❌ (already deleted) |

### Status Transition Rules

- Only `PUBLISHED` content is visible to `STUDENT` role users
- When status changes from any value to `PUBLISHED`, set `published_at = NOW()`
- When soft-deleting: set `deleted_at = NOW()` — do NOT change `status`
- When restoring soft-deleted content: set `deleted_at = NULL`
- All status transitions MUST write to `audit_logs`
- Scheduled posts: a Vercel Cron Job runs every 5 minutes, queries `content WHERE status = 'SCHEDULED' AND scheduled_at <= NOW()`, and transitions them to `PUBLISHED`

### Slug Generation

```typescript
// shared/utils/slugify.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // Remove special characters
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Remove consecutive hyphens
    .substring(0, 100);               // Max 100 characters
}

// Slugs must be unique — append a short UUID suffix if collision detected
// Example: "enrollment-deadline-2025" → "enrollment-deadline-2025-a3f2"
```

---

## 12. Content Visibility Rules

### Visibility Levels

| Value | Who Can See |
|---|---|
| `PUBLIC` | All authenticated users (any role) |
| `ORG_ONLY` | Users whose `org_id` matches one of the content's organizations (or parent org) |
| `DEPT_ONLY` | Users whose `org_id` exactly matches one of the content's organizations |

### Visibility Enforcement Rules

- **Visibility is ALWAYS enforced server-side via Supabase RLS policies**
- **Never** filter visibility only on the client side — this is a security requirement
- When a user queries content, the RLS policy checks `auth.uid()` against the user's org and the content's visibility setting
- `PUBLIC` content is visible to ALL authenticated users regardless of org
- `ORG_ONLY` content uses the org hierarchy: a School-level admin posting to College of Engineering is visible to all users in any Department under that School
- `DEPT_ONLY` content is only visible to users in the exact department

### RLS Policy Example (Conceptual)

```sql
-- Students can only see PUBLISHED, non-deleted content they have visibility access to
CREATE POLICY "students_read_content" ON content
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'PUBLISHED'
    AND (
      visibility = 'PUBLIC'
      OR (
        visibility IN ('ORG_ONLY', 'DEPT_ONLY')
        AND id IN (
          SELECT co.content_id FROM content_organizations co
          WHERE co.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
      )
    )
  );
```

---

## 13. Notification System

### Notification Types

| Type | Trigger | Delivery |
|---|---|---|
| `IN_APP` | Content published to user's org | In-app notification center |
| `EMAIL_IMMEDIATE` | Content published to user's org (preference: IMMEDIATE) | Sent within 1 minute via Resend |
| `EMAIL_DAILY` | Digest of day's announcements | Sent at 8:00 AM daily via cron |
| `EMAIL_WEEKLY` | Digest of week's announcements | Sent Monday 8:00 AM via cron |

### Notification Preference Rules

- Default on first login: `in_app_enabled = TRUE`, `email_digest = 'DAILY'`
- Users can set preferences per organization — e.g., IMMEDIATE for main university, NONE for a less relevant department
- Preferences are stored in `notification_preferences` table
- Students **cannot** disable in-app notifications for urgent posts (future: add `priority` flag to content)
- Notification preferences are scoped to the current user — enforced via RLS

### Notification Creation Rules

- When content transitions to `PUBLISHED`, trigger notification creation for all users in the target organizations
- Bulk-insert into `notifications` table — do NOT create one notification at a time in a loop for large orgs
- Email sending is async — write to a queue (or use Supabase Edge Functions) and send via Resend
- Do NOT send notifications for DRAFT or ARCHIVED status changes
- Mark `read_at = NOW()` when user opens the notification — update via API, not client-side only

### Unread Count

- Unread count is computed as `COUNT(*) FROM notifications WHERE user_id = auth.uid() AND read_at IS NULL`
- Cache this client-side and refresh on focus or every 60 seconds
- Display as a badge on the notification bell icon in the nav

---

## 14. Rich Content & Media

### Rich Text Editor

- **Editor:** Tiptap v2 (headless, customizable)
- **Allowed formats:** Bold, italic, underline, headings (H2, H3), bullet lists, numbered lists, links, blockquotes, horizontal rules
- **NOT allowed:** Raw HTML injection, `<script>` tags, iframes, custom CSS
- **Storage:** Body is stored as HTML string in `content.body`
- **Sanitization:** ALWAYS sanitize HTML with DOMPurify server-side before saving to DB — never trust client-submitted HTML

### File Upload Rules

| File Type | Allowed Extensions | Max Size | Storage Bucket |
|---|---|---|---|
| Image | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | 5 MB | `content-images` |
| PDF | `.pdf` | 20 MB | `content-attachments` |
| General File | `.docx`, `.xlsx`, `.pptx` | 10 MB | `content-attachments` |

### Upload Flow

```
1. User selects file in the editor or attachment field
2. Client validates: file type and size before upload (UX only — not security)
3. Client sends file to Next.js API route (POST /api/media/upload)
4. API route validates: file type and size again (server-side — this is the real check)
5. API route uploads to Supabase Storage using service role key
6. Supabase returns public URL and storage path
7. API route inserts row into media_attachments table
8. API returns the public URL to the client
9. Client inserts URL into Tiptap editor or attachment list
```

### Storage Rules

- **DO** validate file type and size BOTH client-side (UX) and server-side (security)
- **DO NOT** expose the Supabase service role key to the client
- **DO** store `storage_path` in `media_attachments` so files can be deleted from Storage
- **DO NOT** allow file uploads without an authenticated session
- **DO** use Supabase Storage RLS to restrict access to uploaded files
- **DO NOT** serve files from a path that exposes other users' uploads

---

## 15. Search, Filtering & Tagging

### Search Implementation

- **Engine:** PostgreSQL full-text search using `tsvector` and `GIN` index
- **Indexed fields:** `title` (weight A) and `body` (weight B)
- **Search input:** Plain text query string from the user
- **Query type:** `to_tsquery` with `plainto_tsquery` for user-friendly input (handles partial words)

```sql
-- Migration: Add full-text search index
ALTER TABLE content ADD COLUMN search_vector TSVECTOR;

CREATE INDEX idx_content_search ON content USING GIN(search_vector);

-- Update search_vector on insert/update via trigger
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_search_vector_update
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();
```

### Filter Options

| Filter | Values | Notes |
|---|---|---|
| Organization | org UUID or slug | Filters via `content_organizations` join |
| Date Range | `from` and `to` ISO date strings | Filters on `published_at` |
| Status | PUBLISHED, ARCHIVED | Students only see PUBLISHED |
| Tags | Array of tag strings | Filters using PostgreSQL `&&` array operator |
| Author | User UUID | Admin only — students cannot filter by author |

### URL-Driven Filter State

All active filters are reflected in the URL query string for shareability:

```
/announcements?org=college-of-engineering&from=2025-01-01&tags=events,deadlines
```

- Parse filter state from URL on page load using `useSearchParams`
- Update URL on filter change using `router.push` with the new query string
- Never store filter state in local state only — it must survive a page refresh

### Tagging Rules

- Tags are stored as `TEXT[]` on the `content` table
- Predefined tag list is stored in `shared/constants/tags.ts` — editors select from this list
- Custom tags are NOT allowed (prevents tag sprawl)
- Tag names are lowercase, hyphenated: `events`, `enrollment-deadline`, `scholarship`, `general`
- Tags are filterable and searchable

```typescript
// shared/constants/tags.ts
export const CONTENT_TAGS = [
  'general',
  'events',
  'enrollment',
  'scholarship',
  'deadline',
  'academic',
  'extracurricular',
  'emergency',
  'facility',
  'career',
] as const;

export type ContentTag = typeof CONTENT_TAGS[number];
```

---

## 16. External Social Media Posting

> ⚠️ **Phase 5 Only.** Do not implement any part of this module before Phase 4 is complete.

### Supported Platforms

- Facebook Pages (via Facebook Graph API)
- Instagram Business Accounts (via Instagram Graph API, through Facebook)

### Cross-Posting Rules

- Cross-posting is **optional** — unchecked by default on the content creation form
- Only `UNIVERSITY_EDITOR` and `SUPER_ADMIN` can cross-post
- Cross-posting is triggered only when content is **published**, not on draft save
- Platform tokens (access tokens) are stored in a secure server-side environment variable — NEVER in the database or client-side code
- External posts are tracked in `content_external_targets` table
- Failed posts are retried up to 3 times with exponential backoff (30s, 2min, 10min)
- If all retries fail, `status = 'FAILED'` and `error_log` is populated
- An admin notification is sent when an external post fails permanently

### Facebook API Warnings

- Facebook requires app review for `pages_manage_posts` permission — begin this process **early in Phase 4**
- Page Access Tokens expire — implement token refresh logic
- Facebook API has strict rate limits — never post more than 200 requests per hour
- Test with a Facebook Test App and Test Page before going live
- Instagram posting via Graph API requires a Facebook Page linked to an Instagram Business Account

### External Posting DO NOT Rules

- **DO NOT** store Facebook/Instagram tokens in the database
- **DO NOT** attempt to implement this before Phase 4 is complete
- **DO NOT** expose platform credentials to client-side code
- **DO NOT** delete external posts without verifying the platform API call succeeded first
- **DO NOT** cross-post DRAFT or ARCHIVED content — only PUBLISHED

---

## 17. Key Features Summary

| Feature | Phase | Status |
|---|:---:|---|
| Google OAuth with domain restriction | 1 | Planned |
| User profiles and STUDENT default role | 1 | Planned |
| Organization hierarchy (University/School/Dept) | 1 | Planned |
| Announcement create/edit/soft-delete | 1 | Planned |
| Audit logging for all content mutations | 1 | Planned |
| Multi-organization internal posting | 1 | Planned |
| Content visibility rules (PUBLIC/ORG/DEPT) | 1 | Planned |
| Responsive UI (desktop + mobile) | 1 | Planned |
| SUPER_ADMIN dashboard (basic) | 1 | Planned |
| In-app notification center | 2 | Planned |
| Email notifications via Resend | 2 | Planned |
| Per-org notification preferences | 2 | Planned |
| Full-text search (PostgreSQL) | 2 | Planned |
| Filter by org, date, tags | 2 | Planned |
| URL-driven filter state | 2 | Planned |
| Rate limiting on content creation | 2 | Planned |
| Tiptap rich text editor | 3 | Planned |
| Image and PDF attachment uploads | 3 | Planned |
| Draft → Scheduled → Published lifecycle | 3 | Planned |
| Scheduled posting (Vercel Cron) | 3 | Planned |
| Weekly email digest | 3 | Planned |
| WCAG 2.1 AA accessibility audit | 3 | Planned |
| SEO-friendly URL slugs | 3 | Planned |
| Configurable public-facing view | 3 | Planned |
| Student publications module | 4 | Planned |
| Discussion forums with moderation | 4 | Planned |
| Advanced admin dashboard | 4 | Planned |
| Content analytics (views, engagement) | 4 | Planned |
| Retention policy tooling | 4 | Planned |
| Facebook cross-posting | 5 | Planned |
| Instagram cross-posting | 5 | Planned |
| External post retry queue | 5 | Planned |

---

## 18. Phased Development Plan

### Phase 1 — MVP Core

**Goal:** A working, secure announcement portal. Students can log in and read announcements. Admins can create, edit, and delete them.

**Definition of Done for Phase 1:**
- [ ] Google OAuth works with domain restriction (server-side validated)
- [ ] New users are assigned STUDENT role automatically
- [ ] SUPER_ADMIN can be seeded via migration script
- [ ] Organizations are seeded via migration (University, Schools, Departments)
- [ ] Admins can create, edit, archive, and soft-delete announcements
- [ ] Announcements can be posted to multiple organizations at once
- [ ] Students see only PUBLISHED, non-deleted announcements based on visibility rules
- [ ] All content mutations are logged in `audit_logs`
- [ ] UI is responsive (mobile and desktop)
- [ ] All Phase 1 API routes have input validation and return proper HTTP status codes
- [ ] At least 70% unit test coverage for services and utils

**Phase 1 DO NOT:**
- Do not implement notifications yet — log a TODO
- Do not implement search yet — use simple SQL ILIKE for now
- Do not implement rich text yet — use plain textarea for body
- Do not implement file uploads yet
- Do not implement social media posting

---

### Phase 2 — Notifications & Search

**Goal:** Students are proactively informed. Content is discoverable.

**Definition of Done for Phase 2:**
- [ ] In-app notification center with unread badge
- [ ] Email notifications sent via Resend within 1 minute of publish
- [ ] Daily email digest sent at 8:00 AM via Vercel Cron
- [ ] Per-organization notification preferences UI
- [ ] PostgreSQL full-text search working with GIN index
- [ ] Filter by org, date range, and tags
- [ ] URL-driven filter state (filters persist on page refresh)
- [ ] Rate limiting: max 20 content posts per admin per hour (server-side)
- [ ] Weekly digest cron job

**Phase 2 DO NOT:**
- Do not implement rich text editor yet
- Do not implement file uploads yet
- Do not change the DB schema from Phase 1 (only additive changes allowed)

---

### Phase 3 — Rich Content & Media

**Goal:** Announcements look professional. Admins have a full content creation workflow.

**Definition of Done for Phase 3:**
- [ ] Tiptap editor replaces textarea for content body
- [ ] Image upload to Supabase Storage with size/type validation
- [ ] PDF attachment support
- [ ] Draft saving before publish
- [ ] Scheduled posting via Vercel Cron (runs every 5 minutes)
- [ ] WCAG 2.1 AA accessibility audit passed
- [ ] SEO-friendly slugs generated on content creation
- [ ] Optional public-facing view (configurable per deployment)
- [ ] Weekly email digest fully implemented

---

### Phase 4 — Admin & Publications

**Goal:** Full admin control. Student-contributed content.

**Definition of Done for Phase 4:**
- [ ] Advanced admin dashboard: user management, audit log viewer, org management
- [ ] Role assignment UI (SUPER_ADMIN only)
- [ ] Student publications module (articles, editorial team roles)
- [ ] Discussion threads on announcements (threaded, moderated)
- [ ] Content analytics: view counts per announcement
- [ ] Retention policy: admin can permanently delete archived content older than N days
- [ ] Begin Facebook API app review process

---

### Phase 5 — External Social Media

**Goal:** Single post reaches internal portal AND external social media.

**Definition of Done for Phase 5:**
- [ ] Facebook Page cross-posting works end-to-end
- [ ] Instagram cross-posting works end-to-end
- [ ] External post status visible in admin dashboard
- [ ] Failed posts trigger admin notification
- [ ] Retry queue with exponential backoff (3 attempts max)
- [ ] Token management and refresh implemented
- [ ] Edit and delete external posts where platform API supports it

---

## 19. Testing Strategy

### Test Pyramid

```
         /\
        /E2E\          ← Fewest tests, most valuable scenarios
       /------\
      /Integr. \       ← API routes + DB queries
     /----------\
    /   Unit     \     ← Most tests, fastest, isolated
   /--------------\
```

### Unit Tests (Jest + React Testing Library)

**What to test:**
- All functions in `shared/utils/` — 100% coverage required
- All functions in `shared/constants/` — 100% coverage required
- All permission check functions in `shared/utils/permissions.ts`
- All service functions (mocked Supabase client)
- React components: render, user interaction, state changes

**What NOT to test at unit level:**
- Supabase internals — mock the client
- Next.js routing — test this at E2E level
- External APIs — always mock these

### Integration Tests (Jest + Supabase mock)

**What to test:**
- All API route handlers (`/app/api/**`)
- Input validation: missing fields, wrong types, oversized payloads
- Auth: unauthenticated requests return 401, forbidden requests return 403
- CRUD operations return correct HTTP status codes

### End-to-End Tests (Cypress)

**Required E2E scenarios:**

```
1. Login flow
   - User can log in with institutional Google account
   - Non-institutional account is rejected with error message

2. Student read flow
   - Student sees published announcements in feed
   - Student does not see draft or archived content
   - Student can search and filter announcements
   - Student can open an announcement and view full content

3. Admin create flow
   - Admin can create a draft announcement
   - Admin can publish the announcement
   - Published announcement appears in student feed immediately

4. Admin edit/delete flow
   - Admin can edit a published announcement
   - Admin can soft-delete an announcement
   - Soft-deleted announcement disappears from student feed

5. Multi-org posting
   - Admin can post to multiple organizations simultaneously
   - Post appears in feeds for all targeted organizations

6. Notification flow
   - In-app notification appears when new announcement is published
   - Unread count increments correctly
   - Marking as read clears the notification

7. Search flow
   - User can search and find relevant announcements
   - Filters update URL correctly
   - Filters persist on page refresh
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
# On every push to any branch:
# 1. Install dependencies
# 2. Run TypeScript type check
# 3. Run ESLint
# 4. Run unit tests
# 5. Run integration tests

# On merge to main:
# 1. All of the above
# 2. Deploy to Vercel (auto-deploy via Vercel GitHub integration)
# 3. Run E2E tests against staging environment
```

---

## 20. Non-Functional Requirements

| Requirement | Target | Enforcement |
|---|---|---|
| Page load time | ≤ 3 seconds on standard connection | Vercel Analytics, Lighthouse |
| TypeScript coverage | Strict mode, zero `any` types | `tsconfig.json` strict: true |
| Test coverage (unit) | ≥ 70% for all service files | Jest coverage report in CI |
| Accessibility | WCAG 2.1 AA | Phase 3 audit + axe-core in tests |
| Mobile responsiveness | Fully functional on 375px viewport | Manual + Cypress viewport tests |
| Security: auth | Domain restriction server-validated | Auth callback server-side check |
| Security: DB | RLS on ALL tables | Supabase RLS policies |
| Security: input | All user input sanitized server-side | DOMPurify for HTML, Zod for forms |
| Audit completeness | Zero unlogged content mutations | Enforced in service layer |
| URL design | Slugs ≤ 100 chars, human-readable | `slugify` utility function |
| Soft delete | No content is permanently deleted (Phase 1–4) | `deleted_at` pattern, no `DELETE` SQL |
| File size limits | Images ≤ 5 MB, PDFs ≤ 20 MB | Server-side validation in media API |
| Rate limiting | Max 20 content posts per editor per hour | Server-side middleware |
| Error responses | All API errors return JSON with `error` field | Standardized error handler |

---

## 21. API Design Rules

### URL Structure

```
GET    /api/content                         ← List published content (with filters)
GET    /api/content/:id                     ← Get single content item
POST   /api/content                         ← Create new content (auth required)
PATCH  /api/content/:id                     ← Update content (auth + owner/admin)
DELETE /api/content/:id                     ← Soft-delete content (auth + owner/admin)
POST   /api/content/:id/publish             ← Publish content
POST   /api/content/:id/archive             ← Archive content

GET    /api/users/me                        ← Get current user profile
PATCH  /api/users/me                        ← Update own profile

GET    /api/notifications                   ← Get current user notifications
PATCH  /api/notifications/:id/read          ← Mark notification as read
PATCH  /api/notifications/read-all          ← Mark all as read

GET    /api/organizations                   ← List all organizations
POST   /api/admin/organizations             ← Create organization (SUPER_ADMIN only)

GET    /api/admin/users                     ← List all users (SUPER_ADMIN only)
PATCH  /api/admin/users/:id/role            ← Change user role (SUPER_ADMIN only)

POST   /api/media/upload                    ← Upload file, return URL
DELETE /api/media/:id                       ← Delete attachment
```

### API Response Format

```typescript
// ALL API responses must follow this format

// Success:
{
  "data": { /* response payload */ },
  "error": null
}

// Error:
{
  "data": null,
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_CODE"   // e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
  }
}
```

### API Rules

- **DO** validate all request inputs with Zod schemas before processing
- **DO** check authentication on every protected route using Supabase `getUser()` — not `getSession()`
- **DO** check authorization (role/permission) after authentication
- **DO** return 401 for unauthenticated, 403 for unauthorized, 404 for not found, 422 for validation errors
- **DO NOT** return 500 for validation errors
- **DO NOT** expose stack traces or database error messages to the client — log server-side, return generic message
- **DO NOT** use GET requests for mutations
- **DO** use PATCH (not PUT) for partial updates
- **DO** paginate all list endpoints with `page` and `limit` query params (default limit: 20, max: 100)

---

## 22. Naming Conventions

> These conventions are critical for AI tool consistency. Follow them exactly.

### Files

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `AnnouncementCard.tsx` |
| Hooks | camelCase with `use` prefix | `useContent.ts` |
| Services | camelCase with `.service.ts` suffix | `content.service.ts` |
| Types files | camelCase with `.types.ts` suffix | `content.types.ts` |
| Constants files | camelCase with `.ts` | `roles.ts`, `tags.ts` |
| Utility functions | camelCase with `.ts` | `slugify.ts`, `permissions.ts` |
| API route files | kebab-case | `create-content.ts` |
| Test files | mirror source file + `.test.ts` | `content.service.test.ts` |

### TypeScript

| Type | Convention | Example |
|---|---|---|
| Interfaces | PascalCase with `I` prefix | `IContent`, `IUser` |
| Types | PascalCase | `ContentStatus`, `Role` |
| Enums | PascalCase (avoid — prefer `const` objects) | — |
| Constants | SCREAMING_SNAKE_CASE | `ROLES`, `CONTENT_TAGS` |
| Functions | camelCase | `createContent()`, `getUser()` |
| React components | PascalCase | `AnnouncementCard` |
| Props interfaces | PascalCase with `Props` suffix | `AnnouncementCardProps` |

### Database

| Type | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `content`, `users`, `audit_logs` |
| Columns | snake_case | `created_at`, `author_id` |
| Foreign keys | `{referenced_table_singular}_id` | `content_id`, `user_id`, `org_id` |
| Indexes | `idx_{table}_{column}` | `idx_content_search` |
| Functions | snake_case | `update_content_search_vector()` |
| Triggers | `{table}_{event}_{action}` | `content_search_vector_update` |

### API Routes

| Type | Convention | Example |
|---|---|---|
| URL paths | kebab-case | `/api/content`, `/api/audit-logs` |
| Query params | camelCase | `?orgId=xxx&dateFrom=xxx` |
| JSON body keys | camelCase | `{ "authorId": "...", "orgIds": [...] }` |

---

## 23. Coding Rules & Constraints (DOS and DON'TS)

### 🟢 General DO Rules

- **DO** use TypeScript strict mode everywhere — `"strict": true` in tsconfig.json
- **DO** use Zod for all runtime input validation (form submissions, API request bodies)
- **DO** use the Supabase JS client (`createClient`) from `/shared/lib/supabase.ts` — never instantiate it inline
- **DO** use `getUser()` (not `getSession()`) for server-side auth checks — `getSession()` does not revalidate the token
- **DO** handle errors explicitly — every `async` function that can fail must have a try/catch or explicit error return
- **DO** return early from functions when validation fails — avoid deep nesting
- **DO** write one function per file in service files — keep functions small and focused
- **DO** write a JSDoc comment for every exported function in service files
- **DO** run `npm run type-check` before committing — zero TypeScript errors allowed
- **DO** write tests before or alongside features — not after

### 🔴 General DON'T Rules

- **DON'T** use `any` type — use `unknown` and narrow it, or define a proper type
- **DON'T** use `as` type assertions unless absolutely necessary — prefer type guards
- **DON'T** use `console.log` in production code — use a proper logger or remove before committing
- **DON'T** commit `.env.local` or any file containing secrets
- **DON'T** hardcode strings that appear in multiple places — use constants
- **DON'T** write business logic in React components — put it in service files or hooks
- **DON'T** query the database from React components directly — always go through an API route or server action
- **DON'T** use `useEffect` for data fetching — use React Server Components or SWR/React Query
- **DON'T** ignore TypeScript errors by suppressing them with `// @ts-ignore` — fix the type

### 🟢 Database DO Rules

- **DO** use migrations for all schema changes — never alter the database manually in production
- **DO** enable RLS on every new table you create
- **DO** write RLS policies for SELECT, INSERT, UPDATE, DELETE separately
- **DO** use `gen_random_uuid()` for all primary keys
- **DO** use soft delete (`deleted_at`) for content-related tables
- **DO** index foreign key columns that are frequently used in JOINs
- **DO** store timestamps as `TIMESTAMPTZ` (with timezone) — never `TIMESTAMP`

### 🔴 Database DON'T Rules

- **DON'T** run `DELETE FROM content` — always soft delete
- **DON'T** store secrets, tokens, or passwords in the database
- **DON'T** write raw SQL in React components — only in service files or migration files
- **DON'T** disable RLS — ever
- **DON'T** use `auth.uid()` in client-side code — use it only in RLS policies and server-side functions
- **DON'T** store derived data that can be computed from existing columns (except for search vectors)

### 🟢 Security DO Rules

- **DO** validate file types and sizes server-side on every upload request
- **DO** sanitize HTML content with DOMPurify before saving to the database
- **DO** use environment variables for all secrets — never hardcode them
- **DO** validate the institutional email domain server-side on auth callback
- **DO** use the `SUPABASE_SERVICE_ROLE_KEY` only in server-side code (API routes, server actions)
- **DO** implement rate limiting on content creation endpoints

### 🔴 Security DON'T Rules

- **DON'T** expose `SUPABASE_SERVICE_ROLE_KEY` in any client-side code — this bypasses RLS entirely
- **DON'T** trust client-submitted role or permission claims — always read role from the database server-side
- **DON'T** allow unauthenticated access to any API route except `/api/auth/*` and optionally `/api/content` (public view)
- **DON'T** allow HTML body content without DOMPurify sanitization
- **DON'T** store Facebook/Instagram access tokens in the database — use environment variables

### 🟢 UI & Component DO Rules

- **DO** use Tailwind CSS utility classes exclusively — no custom CSS files except for global styles
- **DO** make every page component responsive at 375px, 768px, and 1280px breakpoints
- **DO** use semantic HTML elements (`<article>`, `<nav>`, `<main>`, `<header>`, `<aside>`)
- **DO** add `alt` text to every `<img>` element
- **DO** use `aria-label` on icon-only buttons
- **DO** handle loading states and error states in every data-fetching component

### 🔴 UI & Component DON'T Rules

- **DON'T** use inline styles (`style={{}}`) — use Tailwind classes
- **DON'T** hardcode colors or spacing values — use Tailwind config tokens
- **DON'T** build new UI components from scratch if Tailwind + HTML covers the use case
- **DON'T** render user-supplied HTML without DOMPurify sanitization in the component
- **DON'T** leave loading and error states unhandled — every async UI must have these

### 🟢 Phase Discipline DO Rules

- **DO** complete all items in the current phase's Definition of Done before starting the next phase
- **DO** add `// TODO: Phase N` comments for features intentionally deferred
- **DO** create a GitHub milestone for each phase and close it before starting the next

### 🔴 Phase Discipline DON'T Rules

- **DON'T** implement Phase 2+ features while in Phase 1 — even if it "seems easy"
- **DON'T** start Phase 5 (social media) without completing the Facebook API app review in Phase 4
- **DON'T** change the database schema in a way that breaks existing Phase 1 features — only additive changes

---

## 24. Project Management

### Git Branch Strategy

```
main          ← Production-ready code only. Protected branch.
dev           ← Integration branch. All features merge here first.
feature/*     ← Feature branches. e.g. feature/notification-center
hotfix/*      ← Emergency fixes to main. e.g. hotfix/auth-domain-bypass
```

### Commit Convention (Conventional Commits)

```
feat: add multi-org posting to content creation form
fix: correct RLS policy for DEPT_ONLY visibility
chore: update Supabase client to v2.39
docs: update proposal with Phase 2 notification details
test: add unit tests for slugify utility
refactor: extract permission checks to shared/utils/permissions.ts
```

### GitHub Milestones

- `Phase 1 - MVP Core`
- `Phase 2 - Notifications & Search`
- `Phase 3 - Rich Content & Media`
- `Phase 4 - Admin & Publications`
- `Phase 5 - External Social Media`

### Documentation Requirements

- `README.md` in root: setup instructions, environment variables, how to run locally
- `README.md` in each module folder: what the module does, key files, how to extend it
- `CONTRIBUTING.md`: code style, branch strategy, PR process
- `supabase/migrations/`: every migration file has a descriptive name and comment header
- This file (`CCIP_PROJECT_PROPOSAL.md`): kept up to date as decisions change

---

## 25. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| OAuth misconfiguration allows non-institutional login | Medium | High | Server-side domain validation in auth callback + E2E test for rejection |
| Scope creep bloats Phase 1 | High | High | Strict Definition of Done per phase; defer everything with `// TODO: Phase N` |
| Facebook API approval rejected or delayed | Medium | Medium | Start process in Phase 4; Phase 5 is last so it doesn't block the rest |
| Supabase free tier limits exceeded | Low | Medium | Monitor via Supabase dashboard; optimize queries before scaling |
| Solo developer burnout | Medium | High | Strict phased scope; AI-assisted coding; don't start Phase 2 until Phase 1 is stable |
| Notification spam causes student disengagement | Medium | Medium | Per-org preferences with opt-out; digest options by default |
| Rich text HTML injection attack | Low | High | Server-side DOMPurify sanitization on every content save — non-negotiable |
| Audit log gaps (missed mutations) | Medium | High | Audit log writes happen in the service layer, not the API layer — cannot be bypassed |
| Role escalation vulnerability | Low | High | Role is always read from DB server-side; client cannot claim a role |
| Search performance degrades at scale | Low | Medium | GIN index on `search_vector`; add pagination; consider Supabase full-text optimizations |

---

## 26. Success Metrics

### Phase 1 Launch Metrics

- [ ] Zero authentication bypass incidents
- [ ] All Phase 1 Definition of Done items checked
- [ ] ≥ 70% unit test coverage on service files
- [ ] Page load ≤ 3 seconds on Vercel (measured with Lighthouse)
- [ ] Zero TypeScript errors in CI

### User Engagement Metrics (Post-Launch)

- Monthly active users (target: ≥ 50% of enrolled students in first semester)
- Weekly returning users
- Average announcements published per week by admins
- Notification open rate (email): target ≥ 30%
- Search usage rate: target ≥ 20% of sessions include a search

### Admin Efficiency Metrics

- Reduction in admin time spent duplicating posts across platforms
- Percentage of announcements using multi-org posting
- Frequency of content edits (lower is better — indicates quality at publish time)
- External post error rate (Phase 5): target ≤ 5%

### Quality Metrics

- Zero unlogged content mutations in audit_logs
- Zero production TypeScript errors
- ≥ 95% test pass rate in CI across all branches
- Zero accessibility violations at WCAG 2.1 AA level (Phase 3)

---

## 27. Strategic Advantages

| Advantage | Description |
|---|---|
| **Portfolio Ready** | Demonstrates: auth, RBAC, notifications, search, file uploads, rich text, external APIs, audit logging, cron jobs — a complete full-stack showcase |
| **Modern Architecture** | Modular monolith is the industry-standard for mid-scale applications — shows architectural maturity |
| **Zero Budget** | Entire stack runs on free tiers — proves you can ship real products with no money |
| **Commercially Extensible** | Multi-tenant capable: the organization hierarchy and role system can be white-labeled and sold to other universities |
| **AI-Optimized Codebase** | TypeScript strict mode, explicit interfaces, consistent naming, modular structure — maximizes Copilot effectiveness and reduces hallucination |
| **Secure by Design** | Google OAuth + Supabase RLS + server-side validation + audit logs — not bolted on, built in from day one |
| **Industry Standards** | Conventional commits, CI/CD, automated testing, documentation, phased roadmap — looks like a real team project |
| **Real Problem** | Solves an actual pain point at real universities — can be pitched to institutions as a product |

---

## APPENDIX: Copilot & AI Assistant Usage Guide

> This section is specifically for guiding GitHub Copilot, Claude, ChatGPT, or any other AI coding assistant working on this project.

### How to Use This Document

1. **Before generating any code**, read the relevant section of this document for the feature you are building
2. **Check the naming conventions** in Section 22 before naming any file, function, or variable
3. **Check the DOS and DON'TS** in Section 23 before writing any logic
4. **Check the database schema** in Section 8 before writing any query
5. **Check the phase** in Section 18 — do not generate code for future phases

### Quick Reference for AI Assistants

**The tech stack is:** Next.js 14 App Router + TypeScript strict mode + Supabase JS v2 + Tailwind CSS + Tiptap + Resend + Zod

**The database client is initialized in:** `/shared/lib/supabase.ts`

**Server-side auth check always uses:** `supabase.auth.getUser()` — never `getSession()`

**All inputs are validated with:** Zod schemas

**HTML content is sanitized with:** DOMPurify before saving

**Role constants are in:** `/shared/constants/roles.ts`

**Permission checks are in:** `/shared/utils/permissions.ts`

**Content status values are:** `DRAFT | SCHEDULED | PUBLISHED | ARCHIVED` (string literals)

**Visibility values are:** `PUBLIC | ORG_ONLY | DEPT_ONLY` (string literals)

**Never use `DELETE FROM content`** — always set `deleted_at = NOW()`

**Never use `any` type** — define proper TypeScript types

**Never expose `SUPABASE_SERVICE_ROLE_KEY`** to client-side code

**API responses always follow:** `{ data: T | null, error: { message: string, code: string } | null }`

---

*Last updated: 2026 | Version 2.0 | CCIP Project — Centralized Campus Information Portal*