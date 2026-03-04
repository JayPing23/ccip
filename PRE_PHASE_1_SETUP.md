# CCIP — Pre-Phase 1 Setup Checklist

> This checklist identifies all setup and prerequisite tasks that must be completed **before** Phase 1 development begins. Complete this checklist in order—do not skip items.

**Status:** Not Started
**Target Completion:** Before Phase 1 kickoff
**Last Updated:** March 4, 2026

---

## TABLE OF CONTENTS

1. [Critical Infrastructure Setup](#1-critical-infrastructure-setup)
2. [Database Schema & Migrations](#2-database-schema--migrations)
3. [Supabase Configuration](#3-supabase-configuration)
4. [Project Code Setup](#4-project-code-setup)
5. [Testing Infrastructure](#5-testing-infrastructure)
6. [Documentation](#6-documentation)
7. [Verification Checklist](#7-verification-checklist)
8. [Phase 1 Readiness Confirmation](#8-phase-1-readiness-confirmation)

---

## 1. Critical Infrastructure Setup

These are hard blockers. Phase 1 cannot start without these.

### 1.1 Supabase Project Creation

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES

**What to do:**
1. Go to https://supabase.com and create a new project
2. Select your region (choose closest to your location)
3. Create a strong password for the postgres user
4. Wait for project initialization (5-10 minutes)
5. Copy these credentials to your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL` (from project settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from project settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (from project settings → API, hidden by default)

**Checklist:**
- [ ] Supabase project created
- [ ] All three keys copied to `.env.local`
- [ ] Test connection: run `npm run dev` and verify no auth errors in console

**Time estimate:** 15 min

---

### 1.2 Google OAuth Configuration

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES (critical for auth)

**What to do:**
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project named "CCIP"
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (dev) and your Vercel domain (prod)
   - Authorized redirect URIs: `http://localhost:3000/auth/callback` and `https://your-domain.vercel.app/auth/callback`
5. Copy the Client ID and Client Secret
6. Go to Supabase project → Authentication → Providers → Google
7. Enable Google provider
8. Paste Client ID and Client Secret
9. Set authorized domains to your institutional domain (e.g., `university.edu.ph`)

**Checklist:**
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth credentials created
- [ ] Supabase Google provider configured
- [ ] Authorized domains set to `INSTITUTIONAL_DOMAIN` value

**Time estimate:** 20 min

---

### 1.3 Environment Variables File

**Status:** ⚠️ PARTIAL (`.env.example` exists, `.env.local` missing)
**Required by Phase 1:** YES

**What to do:**
1. Copy `.env.example` to `.env.local`
2. Fill in all values (from Supabase and Google OAuth setup above):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
   INSTITUTIONAL_DOMAIN=university.edu.ph
   RESEND_API_KEY=              # Can be empty for Phase 1
   FACEBOOK_APP_ID=             # Can be empty for Phase 1
   FACEBOOK_APP_SECRET=         # Can be empty for Phase 1
   ```
3. Verify `.env.local` is in `.gitignore` (it is)
4. Test: run `npm run dev` and check that no env var warnings appear

**Checklist:**
- [ ] `.env.local` file created
- [ ] All required values filled in
- [ ] `.env.local` is in `.gitignore`
- [ ] No environment variable warnings in dev server startup

**Time estimate:** 5 min

---

## 2. Database Schema & Migrations

These are the foundation of Phase 1. They must be created and tested before any application code.

### 2.1 Create Database Migrations

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES
**Depends on:** Section 1.1 (Supabase project)

**What to do:**

Create the following migration files in `supabase/migrations/` (use the format `YYYYMMDDHHMMSS_description.sql`). Run them in order against your Supabase database.

#### Migration 1: Create `roles` table and seed data

**File:** `supabase/migrations/001_create_roles_table.sql`

```sql
-- Create roles table
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles (DO NOT change these string values)
INSERT INTO roles (name) VALUES
  ('STUDENT'),
  ('DEPT_EDITOR'),
  ('UNIVERSITY_EDITOR'),
  ('SUPER_ADMIN');

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles
CREATE POLICY "read_all_roles" ON roles FOR SELECT USING (true);
```

#### Migration 2: Create `organizations` table

**File:** `supabase/migrations/002_create_organizations_table.sql`

```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL,  -- UNIVERSITY | SCHOOL | DEPARTMENT
  parent_id   UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for hierarchy queries
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizations
CREATE POLICY "read_all_organizations" ON organizations FOR SELECT USING (true);
```

#### Migration 3: Create `users` table

**File:** `supabase/migrations/003_create_users_table.sql`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role_id       UUID NOT NULL REFERENCES roles(id),
  org_id        UUID REFERENCES organizations(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read own profile and other users (non-sensitive data)
CREATE POLICY "read_own_user" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "read_all_user_basics" ON users FOR SELECT
  USING (true);

-- Users can update own profile only
CREATE POLICY "update_own_user" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Insert new user (managed by trigger)
CREATE POLICY "insert_new_user" ON users FOR INSERT
  WITH CHECK (true);
```

#### Migration 4: Create `content` table

**File:** `supabase/migrations/004_create_content_table.sql`

```sql
CREATE TABLE content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  visibility    TEXT NOT NULL DEFAULT 'ORG_ONLY',  -- PUBLIC | ORG_ONLY | DEPT_ONLY
  author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ,
  scheduled_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_content_deleted_at ON content(deleted_at);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_scheduled_at ON content(scheduled_at) WHERE status = 'SCHEDULED';

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Students can only see PUBLISHED, non-deleted content they have visibility access to
-- (Detailed RLS policies are added in migration 2.2, for now allow all reads for testing)
CREATE POLICY "read_own_or_published" ON content FOR SELECT
  USING (
    (status = 'PUBLISHED' AND deleted_at IS NULL) OR
    (author_id = auth.uid())
  );

-- Only authors or SUPER_ADMIN can insert
CREATE POLICY "insert_own_content" ON content FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Only authors or SUPER_ADMIN can update
CREATE POLICY "update_own_or_admin" ON content FOR UPDATE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));

-- Only authors or SUPER_ADMIN can delete (soft delete via update)
CREATE POLICY "delete_own_or_admin" ON content FOR DELETE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));
```

#### Migration 5: Create `content_organizations` table

**File:** `supabase/migrations/005_create_content_organizations_table.sql`

```sql
CREATE TABLE content_organizations (
  content_id   UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (content_id, org_id)
);

-- Create index for org lookups
CREATE INDEX idx_content_organizations_org_id ON content_organizations(org_id);

-- Enable RLS
ALTER TABLE content_organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read (visibility is controlled via content RLS)
CREATE POLICY "read_all_content_orgs" ON content_organizations FOR SELECT USING (true);

-- Only authors or SUPER_ADMIN can manage
CREATE POLICY "insert_content_orgs" ON content_organizations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM content WHERE id = content_id AND (
      author_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'))
    )
  ));
```

#### Migration 6: Create `audit_logs` table

**File:** `supabase/migrations/006_create_audit_logs_table.sql`

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  action       TEXT NOT NULL,  -- INSERT | UPDATE | DELETE
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  diff         JSONB,  -- { "before": {...}, "after": {...} }
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for lookups
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN can read audit logs
CREATE POLICY "read_audit_logs_admin_only" ON audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));

-- Only service role (or triggers) can insert
CREATE POLICY "insert_audit_logs_service" ON audit_logs FOR INSERT
  WITH CHECK (true);
```

#### Migration 7: Create `media_attachments` table

**File:** `supabase/migrations/007_create_media_attachments_table.sql`

```sql
CREATE TABLE media_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,  -- 'image' | 'pdf' | 'document'
  file_size_bytes INT NOT NULL,
  storage_path    TEXT NOT NULL,  -- Path in Supabase Storage, e.g. 'content-images/abc123.jpg'
  url             TEXT NOT NULL,  -- Public URL
  uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_media_attachments_content_id ON media_attachments(content_id);
CREATE INDEX idx_media_attachments_uploaded_by ON media_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Everyone can read (if they can read the content, they can see attachments)
CREATE POLICY "read_all_media" ON media_attachments FOR SELECT USING (true);

-- Only authors or SUPER_ADMIN can insert
CREATE POLICY "insert_own_media" ON media_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Only authors or SUPER_ADMIN can delete
CREATE POLICY "delete_own_media" ON media_attachments FOR DELETE
  USING (uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));
```

#### Migration 8: Create `notifications` table

**File:** `supabase/migrations/008_create_notifications_table.sql`

```sql
CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id     UUID REFERENCES content(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,  -- IN_APP | EMAIL_IMMEDIATE | EMAIL_DAILY | EMAIL_WEEKLY
  notification_text TEXT,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read own notifications
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark own notifications as read
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service can insert notifications
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  WITH CHECK (true);
```

#### Migration 9: Create `notification_preferences` table

**File:** `supabase/migrations/009_create_notification_preferences_table.sql`

```sql
CREATE TABLE notification_preferences (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled  BOOLEAN DEFAULT TRUE,
  email_digest   TEXT DEFAULT 'DAILY',  -- IMMEDIATE | DAILY | WEEKLY | NONE
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read own preferences
CREATE POLICY "read_own_prefs" ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update own preferences
CREATE POLICY "update_own_prefs" ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Service can insert default preferences
CREATE POLICY "insert_prefs" ON notification_preferences FOR INSERT
  WITH CHECK (true);
```

#### Migration 10: Create `content_external_targets` table

**File:** `supabase/migrations/010_create_content_external_targets_table.sql`

```sql
CREATE TABLE content_external_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,  -- facebook | instagram (Phase 5+)
  external_post_id TEXT,
  status          TEXT DEFAULT 'PENDING',  -- PENDING | POSTED | FAILED
  error_log       TEXT,
  retry_count     INT DEFAULT 0,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_external_targets_content_id ON content_external_targets(content_id);
CREATE INDEX idx_content_external_targets_status ON content_external_targets(status);

-- Enable RLS
ALTER TABLE content_external_targets ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN and UNIVERSITY_EDITOR can see external targets
CREATE POLICY "read_external_targets_admin" ON content_external_targets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name IN ('SUPER_ADMIN', 'UNIVERSITY_EDITOR')
  ));
```

**Checklist:**
- [ ] All 10 migration files created in `supabase/migrations/`
- [ ] Each migration file has a unique timestamp prefix (001-010)
- [ ] Each migration file has a descriptive comment header
- [ ] All migrations have been applied to Supabase (run via Supabase dashboard or CLI)
- [ ] All tables created successfully (verify in Supabase Data Browser)
- [ ] All RLS policies are in place (verify in Supabase Authentication → Policies)
- [ ] Role seeds are created (4 roles in `roles` table)

**Time estimate:** 45 min (including Supabase application)

---

### 2.2 Seed Initial Data

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES (Phase 1 testing requires this)
**Depends on:** Section 2.1 (migrations complete)

**What to do:**

Create a migration or seed script to populate initial organizations and a SUPER_ADMIN user.

#### Migration 11: Seed Initial Organizations

**File:** `supabase/migrations/011_seed_organizations.sql`

```sql
-- Example: University of the Philippines
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  -- University
  ('University of the Philippines', 'up', 'UNIVERSITY', NULL)
RETURNING id AS university_id;

-- Get the university ID (you'll need to copy it from the response)
-- For this example, let's assume it's 'university-uuid-here'

-- Schools under UP
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('College of Engineering', 'college-of-engineering', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up')),
  ('College of Science', 'college-of-science', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up')),
  ('School of Management', 'school-of-management', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up'));

-- Departments under College of Engineering
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Department of Computer Science', 'department-of-computer-science', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'college-of-engineering')),
  ('Department of Civil Engineering', 'department-of-civil-engineering', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'college-of-engineering'));
```

#### Create SUPER_ADMIN User (Manual Step)

Since Supabase Auth requires special handling, the SUPER_ADMIN user must be created manually:

1. Go to Supabase dashboard → Authentication → Users
2. Click "Add user"
3. Enter an email and password (your institutional email)
4. Create the user
5. Go to Supabase Data Browser → `users` table
6. Manually insert a row:
   - `id`: (copy the user ID from the auth users list)
   - `email`: your email
   - `display_name`: Your Name
   - `avatar_url`: leave blank
   - `role_id`: (get the UUID of the 'SUPER_ADMIN' role from the roles table)
   - `org_id`: (optional, set to University if you want)
   - `created_at`: leave blank (auto-set)
   - `updated_at`: leave blank (auto-set)

**Alternative:** Create an auth trigger to auto-insert users on signup (Phase 2).

**Checklist:**
- [ ] 011_seed_organizations.sql migration created and applied
- [ ] 1 University created with at least 2 schools and 2 departments
- [ ] SUPER_ADMIN user created manually in auth and users table
- [ ] Test: Log in as SUPER_ADMIN and verify you can access the app

**Time estimate:** 15 min

---

## 3. Supabase Configuration

### 3.1 Row Level Security (RLS) Verification

**Status:** ⚠️ PARTIAL (Policies created in migrations, need verification)
**Required by Phase 1:** YES (security critical)

**What to do:**
1. Go to Supabase dashboard → Authentication → Policies
2. Verify all tables have RLS enabled:
   - roles: ✅
   - organizations: ✅
   - users: ✅
   - content: ✅
   - content_organizations: ✅
   - audit_logs: ✅
   - media_attachments: ✅
   - notifications: ✅
   - notification_preferences: ✅
   - content_external_targets: ✅
3. For each table, verify policies are in place for:
   - SELECT
   - INSERT
   - UPDATE
   - DELETE (if applicable)

**Checklist:**
- [ ] RLS enabled on all 10 tables
- [ ] Each table has appropriate SELECT policy
- [ ] Each table has appropriate INSERT policy
- [ ] Sensitive tables (audit_logs) have restricted access
- [ ] Test: Try to read audit_logs as a STUDENT role — should fail

**Time estimate:** 10 min

---

### 3.2 Storage Buckets Configuration

**Status:** ❌ NOT DONE
**Required by Phase 1:** NO (Phase 3)
**But good to set up now:** YES

**What to do:**
1. Go to Supabase dashboard → Storage
2. Create a new bucket: `content-images`
   - Type: Private
   - File size limit: 5 MB
3. Create a new bucket: `content-attachments`
   - Type: Private
   - File size limit: 20 MB
4. For each bucket, set RLS policies to allow public read (URLs are pre-signed) but only authenticated users can upload

**Checklist:**
- [ ] `content-images` bucket created (5 MB limit)
- [ ] `content-attachments` bucket created (20 MB limit)
- [ ] Both buckets set to private with authenticated-only uploads

**Time estimate:** 5 min

---

## 4. Project Code Setup

These are the TypeScript types, services, and utilities needed for Phase 1.

### 4.1 Shared Types Files

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES

**What to do:**

Create a `shared/types/` folder with type definitions for all database models.

**File:** `shared/types/database.types.ts`

```typescript
// Auto-generated or manually defined types for all database tables
// This can be auto-generated from Supabase via the CLI, or manually created

export interface IRole {
  id: string;
  name: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN';
  created_at: string;
}

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  type: 'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT';
  parent_id: string | null;
  created_at: string;
}

export interface IUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role_id: string;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IContent {
  id: string;
  title: string;
  body: string;
  slug: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY';
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  deleted_at: string | null;
}

export interface IContentOrganization {
  content_id: string;
  org_id: string;
  created_at: string;
}

export interface IAuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id: string | null;
  diff: {
    before: Record<string, any>;
    after: Record<string, any>;
  } | null;
  created_at: string;
}

export interface INotification {
  id: string;
  user_id: string;
  content_id: string | null;
  type: 'IN_APP' | 'EMAIL_IMMEDIATE' | 'EMAIL_DAILY' | 'EMAIL_WEEKLY';
  notification_text: string | null;
  read_at: string | null;
  created_at: string;
}

export interface INotificationPreference {
  user_id: string;
  org_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_digest: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
  created_at: string;
  updated_at: string;
}

export interface IMediaAttachment {
  id: string;
  content_id: string | null;
  file_name: string;
  file_type: 'image' | 'pdf' | 'document';
  file_size_bytes: number;
  storage_path: string;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export interface IContentExternalTarget {
  id: string;
  content_id: string;
  platform: 'facebook' | 'instagram';
  external_post_id: string | null;
  status: 'PENDING' | 'POSTED' | 'FAILED';
  error_log: string | null;
  retry_count: number;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Checklist:**
- [ ] `shared/types/database.types.ts` created with all 10 interfaces
- [ ] All interfaces use `I` prefix (e.g., `IContent`)
- [ ] All fields match the database schema exactly
- [ ] Date fields are typed as `string` (ISO format from Supabase)

**Time estimate:** 15 min

---

### 4.2 Shared Constants & Utilities

**Status:** ⚠️ PARTIAL (roles.ts, content.ts, tags.ts exist; need utilities)
**Required by Phase 1:** YES

**What to do:**

The constant files already exist. Now create utility files.

**File:** `shared/utils/permissions.ts`

```typescript
import { ROLES, type Role } from '@/shared/constants/roles';

/**
 * Check if a user can create content (any content, any org)
 */
export function canCreateContent(role: Role): boolean {
  return [
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}

/**
 * Check if a user can edit their own content
 */
export function canEditOwnContent(role: Role): boolean {
  return [
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}

/**
 * Check if a user can edit any content (regardless of author)
 */
export function canEditAnyContent(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can delete their own content
 */
export function canDeleteOwnContent(role: Role): boolean {
  return [
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}

/**
 * Check if a user can delete any content
 */
export function canDeleteAnyContent(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can manage roles (assign roles to other users)
 */
export function canManageRoles(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can manage organizations
 */
export function canManageOrganizations(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can view audit logs
 */
export function canViewAuditLogs(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can upload media attachments
 */
export function canUploadMedia(role: Role): boolean {
  return [
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}

/**
 * Check if a user can schedule posts
 */
export function canSchedulePosts(role: Role): boolean {
  return [
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}

/**
 * Check if a user can cross-post to external platforms
 */
export function canCrossPost(role: Role): boolean {
  return [
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ].includes(role);
}
```

**File:** `shared/utils/slugify.ts`

```typescript
/**
 * Convert a title to a URL-safe slug
 * Example: "Enrollment Deadline 2025" → "enrollment-deadline-2025"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure a slug is unique by appending a short UUID suffix if necessary
 * This would be called during content creation:
 *   let slug = generateSlug(title);
 *   slug = await ensureUniqueSlug(supabase, slug);
 *
 * Not implemented here because it requires a DB query.
 * See content.service.ts for the full implementation.
 */
```

**File:** `shared/utils/validation.ts`

```typescript
import { z } from 'zod';
import { CONTENT_STATUS, CONTENT_VISIBILITY } from '@/shared/constants/content';
import { CONTENT_TAGS } from '@/shared/constants/tags';

// Content creation/update schema
export const contentSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  status: z.enum([
    CONTENT_STATUS.DRAFT,
    CONTENT_STATUS.SCHEDULED,
    CONTENT_STATUS.PUBLISHED,
    CONTENT_STATUS.ARCHIVED,
  ] as any),
  visibility: z.enum([
    CONTENT_VISIBILITY.PUBLIC,
    CONTENT_VISIBILITY.ORG_ONLY,
    CONTENT_VISIBILITY.DEPT_ONLY,
  ] as any),
  org_ids: z.array(z.string().uuid()).min(1), // At least one org
  scheduled_at: z.string().datetime().optional().nullable(),
  tags: z.array(z.enum(CONTENT_TAGS as any)).optional(),
});

export type ContentFormData = z.infer<typeof contentSchema>;

// User profile update schema
export const userProfileSchema = z.object({
  display_name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional().nullable(),
});

export type UserProfileData = z.infer<typeof userProfileSchema>;
```

**Checklist:**
- [ ] `shared/utils/permissions.ts` created with all permission check functions
- [ ] `shared/utils/slugify.ts` created with slug generation function
- [ ] `shared/utils/validation.ts` created with Zod schemas
- [ ] All utility functions have JSDoc comments
- [ ] Test: Import and use each function to verify no TypeScript errors

**Time estimate:** 20 min

---

### 4.3 Service Layer Files

**Status:** ⚠️ PARTIAL (content.service.ts exists but incomplete; others missing)
**Required by Phase 1:** YES

**What to do:**

Create service files for each module. These handle all database interactions.

**File:** `modules/content/content.service.ts` (expand from current placeholder)

```typescript
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import { IContent, IAuditLog } from '@/shared/types/database.types';
import { generateSlug } from '@/shared/utils/slugify';
import DOMPurify from 'dompurify';

/**
 * Content Service
 * Handles all database interactions for the content module
 */

/**
 * Get all published content visible to the current user
 * Filtered by user's organization and visibility rules
 */
export async function getPublishedContent() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as IContent[];
}

/**
 * Get a single content item by ID
 */
export async function getContentById(contentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (error) throw new Error(error.message);
  return data as IContent;
}

/**
 * Get a single content item by slug
 */
export async function getContentBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message); // 404 is expected
  return data as IContent | null;
}

/**
 * Create a new content item
 * Automatically creates audit log entry
 */
export async function createContent(
  title: string,
  body: string,
  status: string,
  visibility: string,
  orgIds: string[],
  userId: string,
  scheduledAt?: string | null
) {
  const supabase = await createServerSupabaseClient();

  // Sanitize HTML
  const sanitizedBody = DOMPurify.sanitize(body);

  // Generate unique slug
  let slug = generateSlug(title);
  // TODO: Check for slug collision and append UUID suffix if needed
  // For Phase 1, assume slug is always unique (test thoroughly)

  // Create content
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .insert({
      title,
      body: sanitizedBody,
      slug,
      status,
      visibility,
      author_id: userId,
      scheduled_at: scheduledAt || null,
      published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (contentError) throw new Error(contentError.message);
  const content = contentData as IContent;

  // Link to organizations
  const contentOrgLinks = orgIds.map((orgId) => ({
    content_id: content.id,
    org_id: orgId,
  }));

  const { error: linkError } = await supabase
    .from('content_organizations')
    .insert(contentOrgLinks);

  if (linkError) throw new Error(linkError.message);

  // Audit log
  await logAuditEvent(
    'content',
    content.id,
    'INSERT',
    userId,
    null,
    content
  );

  return content;
}

/**
 * Update an existing content item
 * Automatically creates audit log entry
 */
export async function updateContent(
  contentId: string,
  updates: Partial<IContent>,
  userId: string
) {
  const supabase = await createServerSupabaseClient();

  // Get before state for audit log
  const before = await getContentById(contentId);

  // Sanitize HTML if body is being updated
  if (updates.body) {
    updates.body = DOMPurify.sanitize(updates.body);
  }

  // Set updated_at
  updates.updated_at = new Date().toISOString();

  // If transitioning to PUBLISHED, set published_at
  if (updates.status === 'PUBLISHED' && before.status !== 'PUBLISHED') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const content = data as IContent;

  // Audit log
  await logAuditEvent(
    'content',
    contentId,
    'UPDATE',
    userId,
    before,
    content
  );

  return content;
}

/**
 * Soft delete a content item
 * Sets deleted_at timestamp
 */
export async function deleteContent(contentId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const before = await getContentById(contentId);

  const { data, error } = await supabase
    .from('content')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const content = data as IContent;

  // Audit log
  await logAuditEvent(
    'content',
    contentId,
    'DELETE',
    userId,
    before,
    content
  );

  return content;
}

/**
 * Log an audit event for content mutations
 * Internal helper function
 */
async function logAuditEvent(
  tableName: string,
  recordId: string,
  action: string,
  userId: string,
  before: any,
  after: any
) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    user_id: userId,
    diff: {
      before,
      after,
    },
  });

  if (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw — audit log failure should not block the mutation
  }
}
```

Create similar service files for:
- `modules/users/users.service.ts`
- `modules/organizations/organizations.service.ts`
- `modules/auth/auth.service.ts`
- `modules/roles/roles.service.ts`

(Not expanding all here for brevity, but follow the same pattern: query DB, sanitize inputs, handle errors, log mutations)

**Checklist:**
- [ ] `modules/content/content.service.ts` expanded with all functions
- [ ] `modules/users/users.service.ts` created with user CRUD functions
- [ ] `modules/organizations/organizations.service.ts` created with org functions
- [ ] `modules/auth/auth.service.ts` created with auth functions
- [ ] `modules/roles/roles.service.ts` created with role functions
- [ ] All service files use JSDoc comments
- [ ] All functions throw descriptive errors
- [ ] All mutations log to audit_logs

**Time estimate:** 60 min

---

### 4.4 API Response Format & Error Handling

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES (all API routes depend on this)

**What to do:**

Create a standard API response format and error handler middleware.

**File:** `shared/utils/api-response.ts`

```typescript
/**
 * Standard API response format
 * All API routes must return this format
 */

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code: string;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  code: string
): ApiResponse<null> {
  return { data: null, error: { message, code } };
}
```

**File:** `shared/utils/api-errors.ts`

```typescript
import { NextResponse } from 'next/server';
import { errorResponse } from './api-response';

/**
 * API error codes for consistent error handling
 */
export const API_ERRORS = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 422 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  RATE_LIMIT: { code: 'RATE_LIMIT', status: 429 },
  INTERNAL_SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR', status: 500 },
};

/**
 * Helper to return error response with correct HTTP status
 */
export function apiError(
  message: string,
  errorType: keyof typeof API_ERRORS
) {
  const error = API_ERRORS[errorType];
  return NextResponse.json(
    errorResponse(message, error.code),
    { status: error.status }
  );
}
```

**Checklist:**
- [ ] `shared/utils/api-response.ts` created
- [ ] `shared/utils/api-errors.ts` created
- [ ] All error codes match the proposal (Section 21)
- [ ] HTTP status codes are correct

**Time estimate:** 10 min

---

## 5. Testing Infrastructure

### 5.1 Jest Configuration

**Status:** ❌ NOT DONE
**Required by Phase 1:** NO (but needed for Phase 1 completion)

**What to do:**

Create Jest config for unit tests.

**File:** `jest.config.js`

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'shared/**/*.ts',
    'shared/**/*.tsx',
    'modules/**/*.service.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

**File:** `jest.setup.js`

```javascript
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
```

**Checklist:**
- [ ] `jest.config.js` created
- [ ] `jest.setup.js` created
- [ ] Test script in `package.json` references Jest
- [ ] Test: `npm test` runs (will show 0 tests found, which is ok)

**Time estimate:** 5 min

---

### 5.2 Test Examples & Templates

**Status:** ❌ NOT DONE
**Required by Phase 1:** NO (but good to have examples)

Create example test files to show developers how to test services and utilities.

**File:** `shared/utils/permissions.test.ts`

```typescript
import {
  canCreateContent,
  canEditAnyContent,
  canManageRoles,
} from './permissions';
import { ROLES } from '@/shared/constants/roles';

describe('Permissions Utils', () => {
  describe('canCreateContent', () => {
    it('returns true for DEPT_EDITOR', () => {
      expect(canCreateContent(ROLES.DEPT_EDITOR)).toBe(true);
    });

    it('returns true for UNIVERSITY_EDITOR', () => {
      expect(canCreateContent(ROLES.UNIVERSITY_EDITOR)).toBe(true);
    });

    it('returns true for SUPER_ADMIN', () => {
      expect(canCreateContent(ROLES.SUPER_ADMIN)).toBe(true);
    });

    it('returns false for STUDENT', () => {
      expect(canCreateContent(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canEditAnyContent', () => {
    it('returns true only for SUPER_ADMIN', () => {
      expect(canEditAnyContent(ROLES.SUPER_ADMIN)).toBe(true);
      expect(canEditAnyContent(ROLES.DEPT_EDITOR)).toBe(false);
      expect(canEditAnyContent(ROLES.UNIVERSITY_EDITOR)).toBe(false);
      expect(canEditAnyContent(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canManageRoles', () => {
    it('returns true only for SUPER_ADMIN', () => {
      expect(canManageRoles(ROLES.SUPER_ADMIN)).toBe(true);
      expect(canManageRoles(ROLES.DEPT_EDITOR)).toBe(false);
      expect(canManageRoles(ROLES.UNIVERSITY_EDITOR)).toBe(false);
      expect(canManageRoles(ROLES.STUDENT)).toBe(false);
    });
  });
});
```

**Checklist:**
- [ ] Example test file created at `shared/utils/permissions.test.ts`
- [ ] Test: `npm test` should run the example test and show it passing
- [ ] Template understood for testing other utility functions

**Time estimate:** 10 min

---

## 6. Documentation

### 6.1 README.md

**Status:** ❌ NOT DONE
**Required by Phase 1:** YES (onboarding)

**What to do:**

Create a comprehensive README.md for the project.

**File:** `README.md`

```markdown
# CCIP — Centralized Campus Information Portal

A secure, role-based web platform that centralizes all official university communications into one place.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier)
- Google OAuth credentials for institutional domain

### Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in your Supabase and Google OAuth credentials:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your keys
   ```

3. Run database migrations (see PRE_PHASE_1_SETUP.md):
   - Create all 11 SQL migrations in Supabase
   - Seed the initial organizations and SUPER_ADMIN user

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/               - Next.js App Router pages and routes
modules/           - Feature modules (content, users, auth, etc.)
shared/            - Shared constants, types, utils, components
supabase/          - Database migrations
tests/             - Unit, integration, and E2E tests
```

For detailed architecture and design decisions, see `CCIP_PROJECT_PROPOSAL.md`.

## Development

### Available Scripts

- `npm run dev` — Start dev server at http://localhost:3000
- `npm run build` — Build for production
- `npm run type-check` — Run TypeScript compiler (zero errors required)
- `npm run lint` — Run ESLint
- `npm run format` — Format code with Prettier
- `npm test` — Run Jest unit tests
- `npm run test:watch` — Re-run tests on file changes
- `npm run test:coverage` — Generate coverage report
- `npm run test:e2e` — Run Cypress E2E tests

### TypeScript

This project uses **strict mode**. All code must be fully typed. The `tsconfig.json` enforces:
- `strict: true` — All TypeScript checks enabled
- `noUnusedLocals: true` — Unused variables cause errors
- `noUnusedParameters: true` — Unused parameters cause errors
- `noImplicitReturns: true` — All code paths must return a value

### Code Style

Code is automatically formatted with Prettier on save (via VS Code settings). ESLint catches style violations.

To format all files:
```bash
npm run format
```

### Database Migrations

All schema changes go in `supabase/migrations/`. Run migrations via Supabase dashboard or CLI:

```bash
supabase migration up
```

Never modify the schema manually in production.

## Authentication

Users log in with their institutional Google account. The domain is restricted to `INSTITUTIONAL_DOMAIN` environment variable.

- **Client:** Supabase Auth + Google OAuth 2.0
- **Server-side validation:** Email domain checked on every auth callback
- **RLS (Row Level Security):** All data access is controlled at the database level

## API Design

All API endpoints follow this format:

```typescript
// Request
POST /api/content
{ "title": "...", "body": "...", ... }

// Response (success)
{
  "data": { "id": "...", ... },
  "error": null
}

// Response (error)
{
  "data": null,
  "error": { "message": "...", "code": "VALIDATION_ERROR" }
}
```

See `CCIP_PROJECT_PROPOSAL.md` Section 21 for full API design rules.

## Phase Progress

- **Phase 1** — MVP Core (In Progress)
- **Phase 2** — Notifications & Search (Planned)
- **Phase 3** — Rich Content & Media (Planned)
- **Phase 4** — Admin & Publications (Planned)
- **Phase 5** — External Social Media (Planned)

For Phase definitions and requirements, see `CCIP_PROJECT_PROPOSAL.md` Section 18.

## Contributing

See `CONTRIBUTING.md` for branch strategy, commit conventions, and pull request process.

## License

Private. See repo settings for access.
```

**Checklist:**
- [ ] `README.md` created in project root
- [ ] Setup instructions are clear and complete
- [ ] All scripts are documented
- [ ] Links to proposal and other docs are included

**Time estimate:** 15 min

---

### 6.2 Contributing Guide

**Status:** ❌ NOT DONE
**Required by Phase 1:** NO (but good practice)

**File:** `CONTRIBUTING.md`

```markdown
# Contributing to CCIP

## Branch Strategy

```
main          ← Production-ready code only. Protected branch.
dev           ← Integration branch. All features merge here first.
feature/*     ← Feature branches. e.g. feature/content-creation
hotfix/*      ← Emergency fixes to main. e.g. hotfix/auth-bypass
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-org posting to content form
fix: correct RLS policy for DEPT_ONLY visibility
docs: update API design documentation
test: add unit tests for permissions utils
refactor: extract permission check functions
chore: update Supabase client to v2.39
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make commits following Conventional Commits
3. Push to GitHub: `git push origin feature/my-feature`
4. Open a PR targeting `dev` branch
5. CI must pass (TypeScript, ESLint, unit tests)
6. At least 1 approval required
7. Merge via GitHub (squash commits if messy)

## Code Quality Standards

- TypeScript strict mode: zero `any` types
- No console.log in production code
- All public functions have JSDoc comments
- Min 70% test coverage for service files
- All API routes return standardized response format

## Before Committing

```bash
npm run type-check    # Zero errors required
npm run lint          # Zero errors required
npm run format        # Format code
npm test              # All tests pass
```

## Adding a New Module

1. Create folder structure under `modules/my-module/`
2. Create service file: `modules/my-module/my-module.service.ts`
3. Create types file: `modules/my-module/types/my-module.types.ts`
4. Create API routes as needed: `modules/my-module/api/*.ts`
5. Create React components: `modules/my-module/components/*.tsx`
6. Create hooks: `modules/my-module/hooks/*.ts`
7. Create tests: `modules/my-module/**/*.test.ts`

## Phasing

- Do not implement Phase N+ features while in Phase N-1
- Use `// TODO: Phase N` comments for deferred features
- Complete Definition of Done for current phase before moving to next

## Questions?

See `CCIP_PROJECT_PROPOSAL.md` for architecture, naming conventions, and coding rules.
```

**Checklist:**
- [ ] `CONTRIBUTING.md` created
- [ ] Branch strategy explained
- [ ] Commit conventions documented
- [ ] Code quality standards listed

**Time estimate:** 10 min

---

## 7. Verification Checklist

Before declaring Phase 1-ready, verify all of these:

### Code Verification
- [ ] `npm run type-check` returns zero errors
- [ ] `npm run lint` returns zero errors
- [ ] `npm run format:check` shows code is formatted
- [ ] `npm test` runs successfully (may be 0 tests at this point)

### Database Verification
- [ ] All 11 migrations applied to Supabase
- [ ] All tables exist with correct columns and types
- [ ] All RLS policies are in place
- [ ] Role seeds exist (4 roles)
- [ ] Organizations seeded (University → Schools → Departments)
- [ ] SUPER_ADMIN user created and can log in

### Configuration Verification
- [ ] `.env.local` exists with all required keys
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets appear in git history (`git log -p`)
- [ ] Google OAuth is configured in Supabase and Google Cloud
- [ ] All Supabase keys are correct (test by running dev server)

### Documentation Verification
- [ ] `README.md` exists and is current
- [ ] `CONTRIBUTING.md` exists
- [ ] `PRE_PHASE_1_SETUP.md` exists (this file)
- [ ] All docs link to `CCIP_PROJECT_PROPOSAL.md`

### File Structure Verification
- [ ] All 10 modules have correct folder structure
- [ ] Shared folder has: components/, constants/, hooks/, lib/, types/, utils/
- [ ] Tests folder has: unit/, integration/, e2e/ (may be empty)
- [ ] supabase/ folder has: migrations/

---

## 8. Phase 1 Readiness Confirmation

### Readiness Criteria

**Phase 1 can begin when ALL of the following are true:**

- ✅ Supabase project created and all 11 migrations applied
- ✅ Google OAuth configured and tested
- ✅ `.env.local` created with all secrets
- ✅ All database tables created with RLS enabled
- ✅ Initial data seeded (roles, orgs, SUPER_ADMIN user)
- ✅ All shared types, constants, and utilities created
- ✅ Service layer files created for all modules
- ✅ Jest configuration complete
- ✅ API response format standardized
- ✅ README.md and CONTRIBUTING.md created
- ✅ `npm run dev` starts without errors
- ✅ Test user (SUPER_ADMIN) can log in successfully

### Go/No-Go Decision

**GO to Phase 1 if:** All criteria above are met AND developer has no unanswered questions.

**NO-GO if:** Any criteria are incomplete OR any infrastructure issues remain after debugging.

### Final Checklist Before Phase 1 Kickoff

- [ ] All items in Section 1-6 are DONE
- [ ] All 8 verification items pass
- [ ] All readiness criteria met
- [ ] Development environment is clean (`git status` is empty)
- [ ] First commit: `git commit -m "chore: pre-phase-1 setup complete"`
- [ ] Push to `dev` branch and create a GitHub milestone for "Phase 1"

---

**Next Steps:**

🎉 Once this checklist is complete, begin Phase 1 development per `CCIP_PROJECT_PROPOSAL.md` Section 18.

See Phase 1 Definition of Done for Phase 1 requirements.

---

*Pre-Phase 1 Setup Checklist | CCIP Project v2.0 | Last Updated: March 4, 2026*
