# CCIP — Phase 1 Setup Guide

Complete step-by-step instructions to set up Supabase, Google OAuth, environment variables, database migrations, and seed data. **Estimated time: 90 minutes total.**

---

## Overview

1. **Create Supabase Project** (~15 min)
2. **Configure Google OAuth** (~20 min)
3. **Set Up Environment Variables** (~5 min)
4. **Run Database Migrations** (~30 min)
5. **Seed Initial Data** (~15 min)
6. **Start Development Server** (~5 min)

---

## STEP 1: Create Supabase Project

### 1a. Create New Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account
2. Click **"New Project"**
3. Choose your organization or create a new one
4. Name: `CCIP` (or your preferred name)
5. Database password: **Create a strong password** (save this, you'll need it)
6. Region: **Select your nearest region** (affects latency)
7. Click **"Create new project"**
8. **Wait 5-10 minutes** for database initialization (you'll see a progress indicator)

### 1b. Copy Supabase Credentials

Once the project is ready:

1. In the Supabase dashboard, go to **Settings → API** (left sidebar)
2. You'll see the following URLs and keys:

   | Item | Value | Where to find |
   |------|-------|---------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | **Project URL** field |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (long string) | **anon public** key in **API tokens** section |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (long string, different from above) | Click **"Hide"** button next to Service Role, then click keys icon to show |

3. **Copy each value** — you'll paste them into `.env.local` in Step 3

**✅ Checklist:**
- [ ] Supabase project created
- [ ] Project URL copied (looks like `https://xxxxx.supabase.co`)
- [ ] Anon public key copied
- [ ] Service role key copied (keep this SECRET)

---

## STEP 2: Configure Google OAuth

### 2a. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **Create a new project:**
   - Click the project selector dropdown (top left, next to "Google Cloud")
   - Click **"NEW PROJECT"**
   - Name: `CCIP` or `CCIP-Auth`
   - Click **"CREATE"**
   - Wait for creation to complete

### 2b. Enable Google+ API

1. In your new Google Cloud project, go to **APIs & Services → Library** (left sidebar)
2. Search for **"Google+ API"**
3. Click on **Google+ API**
4. Click **"ENABLE"**
5. Wait for enablement to complete

### 2c. Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
3. You may be prompted to create an OAuth consent screen first:
   - Click **"CREATE CONSENT SCREEN"**
   - Choose: **"External"** (unless your university uses Google Workspace)
   - Fill in:
     - **App name:** CCIP
     - **User support email:** your-email@example.com
     - **Developer contact:** your-email@example.com
   - Click **"SAVE AND CONTINUE"** through all steps
   - Go back to **Credentials**

4. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
5. Select **"Web application"**
6. Name: `CCIP Dev` or `CCIP Local`
7. In **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (development)
   - `http://127.0.0.1:3000` (alternative local)

8. In **Authorized redirect URIs**, add:
   - `http://localhost:3000/auth/callback/google`
   - `http://127.0.0.1:3000/auth/callback/google`

9. Click **"CREATE"**
10. A popup with credentials will appear:
    - **Client ID:** Copy this value (looks like `xxxxx.apps.googleusercontent.com`)
    - **Client Secret:** Copy this value (looks like `GOCSPX-xxxxx`)

**Important:** Keep the Client Secret secret! Don't commit it to git.

**✅ Checklist:**
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID copied
- [ ] Client Secret copied

### 2d. Configure Supabase to Use Google OAuth

1. In your **Supabase dashboard**, go to **Authentication → Providers** (left sidebar)
2. Find **"Google"** in the list
3. Toggle **Enable Sign in with Google** to ON
4. Paste your **Client ID** into the **Client ID** field
5. Paste your **Client Secret** into the **Client Secret** field
6. Click **"Save"**

**✅ Checklist:**
- [ ] Supabase Google OAuth provider enabled
- [ ] Client ID pasted
- [ ] Client Secret pasted

---

## STEP 3: Set Up Environment Variables

### 3a. Create `.env.local` File

1. In your project root (same folder as `package.json`), create a new file named `.env.local`
   ```bash
   # From terminal or VS Code
   touch .env.local  # On Windows PowerShell: New-Item -Path .env.local -ItemType File
   ```

2. Open `.env.local` and fill in the following values from Steps 1-2:

```dotenv
# ============================================================================
# DATABASE & AUTHENTICATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# INSTITUTIONAL CONFIGURATION
# ============================================================================
INSTITUTIONAL_DOMAIN=example.edu.ph
ORG_NAME=Example University

# ============================================================================
# GOOGLE OAUTH 2.0
# ============================================================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================================
# OPTIONAL (can be empty for Phase 1)
# ============================================================================
RESEND_API_KEY=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

**Important Notes:**
- Replace `https://xxxxx.supabase.co` with your actual Supabase URL
- Replace keys with your actual Supabase keys
- Replace `example.edu.ph` with your institutional email domain (e.g., `up.edu.ph`, `mit.edu`)
- Replace `Example University` with your university name
- Replace Google Client ID and Secret with your actual credentials
- **Never commit `.env.local` to git** — it's already in `.gitignore`

### 3b. Verify Environment Variables

1. Run: `npm run dev`
2. In the browser console (F12), you should NOT see warnings like:
   - `"NEXT_PUBLIC_SUPABASE_URL is missing"`
   - `"NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing"`
3. The dev server should start on `http://localhost:3000`

**✅ Checklist:**
- [ ] `.env.local` file created in project root
- [ ] All required values filled in
- [ ] No environment variable warnings in console
- [ ] Dev server starts without errors

---

## STEP 4: Run Database Migrations

Database migrations create all the tables, indexes, and Row Level Security (RLS) policies your app needs.

### 4a. Access Supabase SQL Editor

1. Go to your **Supabase dashboard**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### 4b. Create Tables (Migrations 1-10)

You'll run 10 SQL migrations in order. **Copy and paste each SQL block below**, then click **"Run"**.

---

#### Migration 1: Create Roles Table

Copy and run this SQL:

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

✅ After running, you should see "Success" and 4 rows in the roles table.

---

#### Migration 2: Create Organizations Table

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

---

#### Migration 3: Create Users Table

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

---

#### Migration 4: Create Content Table

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

---

#### Migration 5: Create Content Organizations Junction Table

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

---

#### Migration 6: Create Audit Logs Table

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

---

#### Migration 7: Create Media Attachments Table

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

---

#### Migration 8: Create Notifications Table

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

---

#### Migration 9: Create Notification Preferences Table

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

---

#### Migration 10: Create Content External Targets Table

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

---

### 4c. Verify All Tables Created

1. In the Supabase dashboard, go to **"Database → Tables"**
2. You should see all 10 tables:
   - ✅ roles
   - ✅ organizations
   - ✅ users
   - ✅ content
   - ✅ content_organizations
   - ✅ audit_logs
   - ✅ media_attachments
   - ✅ notifications
   - ✅ notification_preferences
   - ✅ content_external_targets

3. Click on each table to verify columns and indexes are correct

**✅ Checklist:**
- [ ] All 10 SQL migrations executed successfully
- [ ] All 10 tables created (visible in Tables view)
- [ ] No errors in Supabase SQL Editor
- [ ] Each table has correct columns and indexes

---

## STEP 5: Seed Initial Data

### 5a. Create Root Organization

Run this SQL in Supabase SQL Editor:

```sql
-- Create the root university organization
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('University of the Philippines', 'up', 'UNIVERSITY', NULL);

-- Create schools under UP
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('College of Engineering', 'college-of-engineering', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up')),
  ('College of Science', 'college-of-science', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up')),
  ('School of Management', 'school-of-management', 'SCHOOL', (SELECT id FROM organizations WHERE slug = 'up'));

-- Create departments under College of Engineering
INSERT INTO organizations (name, slug, type, parent_id) VALUES
  ('Department of Computer Science', 'department-of-computer-science', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'college-of-engineering')),
  ('Department of Civil Engineering', 'department-of-civil-engineering', 'DEPARTMENT', (SELECT id FROM organizations WHERE slug = 'college-of-engineering'));
```

**✅ After running, you should see 7 organizations (1 university + 3 schools + 2 departments + 1 more).**

### 5b. Create SUPER_ADMIN User

This is a **manual step** because Supabase Auth requires special handling.

#### Step 1: Create Auth User

1. Go to Supabase dashboard → **"Authentication → Users"**
2. Click **"Add user"**
3. Email: Use an email with your institutional domain (e.g., `admin@up.edu.ph`)
4. Password: Create a strong password (8+ characters)
5. Click **"Create user"**
6. **Copy the User ID** (looks like `uuid-string`)

#### Step 2: Create User Profile

1. Go to **"Table Editor"** in Supabase dashboard
2. Click on the **"users"** table
3. Click **"Insert row"**
4. Fill in:
   - **id**: Paste the User ID from Step 1
   - **email**: Same email as Step 1
   - **display_name**: "System Administrator" or your name
   - **avatar_url**: Leave blank
   - **role_id**: Click the cell and select "SUPER_ADMIN" from the dropdown (or paste the UUID if no dropdown)
   - **org_id**: Optional — click to select "University of the Philippines"
   - **created_at**: Leave blank (auto-set)
   - **updated_at**: Leave blank (auto-set)
5. Click **"Save"**

**✅ Verification:** Go back to the users table and you should see 1 row with your SUPER_ADMIN user.

---

## STEP 6: Start Development Server

### 6a. Install Dependencies (if needed)

```bash
npm install
```

### 6b. Run Dev Server

```bash
npm run dev
```

You should see:
```
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

Ready in XXXms
```

### 6c. Test the Application

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the login page
3. Click **"Sign in with Google"**
4. Use the email you created in Step 5b (the SUPER_ADMIN account)
5. You should be logged in and see the dashboard

**✅ Checklist:**
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts successfully
- [ ] Dev server runs at http://localhost:3000
- [ ] Login page displays
- [ ] Google OAuth login works
- [ ] SUPER_ADMIN user can log in

---

## Troubleshooting

### "Environment variables are missing"

**Error:** `Error: NEXT_PUBLIC_SUPABASE_URL is missing`

**Fix:**
1. Check `.env.local` file exists in the project root
2. Make sure all variables in Step 3 are filled in (not empty)
3. Save the file
4. Stop dev server (`Ctrl+C`) and restart (`npm run dev`)

### "Invalid Client ID"

**Error:** `Error: Invalid Google Client ID`

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Copy the correct Client ID (should have `.apps.googleusercontent.com` at the end)
3. Verify it matches in `.env.local`
4. Restart dev server

### "RLS policy prevents access"

**Error:** `row level security violation` when trying to log in

**Fix:**
1. Check that all RLS policies were created (Step 4c)
2. Make sure `auth.uid()` is working correctly:
   - Go to Supabase SQL Editor and run: `SELECT auth.uid();`
   - If it returns `NULL`, auth is not set up correctly

### "Slug already exists"

**Error:** `duplicate key value violates unique constraint "content_slug_key"`

**Fix:**
1. The slug generation function needs to append a UUID
2. This is handled by the `appendUuidToSlug()` function in the code
3. Make sure you're not manually inserting content with duplicate slugs

### "Foreign key constraint fails"

**Error:** `insert or update violates foreign key constraint`

**Fix:**
1. Make sure you inserted all seed data from Step 5
2. Make sure organization IDs exist before creating content
3. Make sure role IDs exist before assigning roles to users

---

## What's Next?

✅ **Phase 1 Infrastructure is now set up!** You can now:

1. **Start Phase 1 feature development** — See `CCIP_PROJECT_PROPOSAL.md` Section 18 for Phase 1 requirements
2. **Create API routes** — Start building endpoints in `/app/api/`
3. **Create React components** — Start building UI in `/modules/*/components/`
4. **Write tests** — Run `npm test` to validate

For ongoing development tips, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Quick Reference

**Commands:**
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run type-check    # Check TypeScript errors
npm run lint          # Check code style
npm run format        # Format code with Prettier
npm test              # Run unit tests
```

**Important Files:**
- [.env.local](.env.local) - Environment variables (not in git)
- [.env.example](.env.example) - Template (in git)
- [CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md) - Project specification
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code guidelines

**Supabase Dashboard:**
- Tables: https://app.supabase.com/project/xxxxx/editor
- SQL Editor: https://app.supabase.com/project/xxxxx/sql
- Auth Users: https://app.supabase.com/project/xxxxx/auth
- Policies: https://app.supabase.com/project/xxxxx/auth/policies

---

*CCIP Phase 1 Setup Guide | Last Updated: March 4, 2026*
