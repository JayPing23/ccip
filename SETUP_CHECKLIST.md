# CCIP Phase 1 Setup Checklist

**Estimated Time: 90 minutes**

Use this checklist to track progress through setup. For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

---

## PHASE 1: Create Supabase Project (15 min)

- [ ] Go to https://supabase.com
- [ ] Sign in or create account
- [ ] Create new project named "CCIP"
- [ ] Choose region closest to you
- [ ] Create strong database password (save it)
- [ ] Wait 5-10 minutes for initialization
- [ ] Go to Settings → API
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` (PostgreSQL URL)
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY` (service role key — keep secret)

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## PHASE 2: Configure Google OAuth (20 min)

- [ ] Go to https://console.cloud.google.com
- [ ] Create new project named "CCIP"
- [ ] Wait for creation complete
- [ ] Go to APIs & Services → Library
- [ ] Enable "Google+ API"
- [ ] Go to Credentials → Create OAuth Consent Screen
  - [ ] Choose "External"
  - [ ] Fill app name, support email, developer email
  - [ ] Click through all steps
- [ ] Go to Credentials → Create OAuth 2.0 Client ID
  - [ ] Choose "Web application"
  - [ ] Name: "CCIP Dev"
  - [ ] Add authorized JavaScript origins:
    - [ ] `http://localhost:3000`
    - [ ] `http://127.0.0.1:3000`
  - [ ] Add authorized redirect URIs:
    - [ ] `http://localhost:3000/auth/callback/google`
    - [ ] `http://127.0.0.1:3000/auth/callback/google`
  - [ ] Click Create
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] Go to Supabase → Authentication → Providers → Google
- [ ] Toggle Google provider ON
- [ ] Paste Client ID
- [ ] Paste Client Secret
- [ ] Click Save

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## PHASE 3: Set Up Environment Variables (5 min)

- [ ] Create file `.env.local` in project root
- [ ] Open `.env.local` in editor
- [ ] Fill in all values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<from Step 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Step 1>
SUPABASE_SERVICE_ROLE_KEY=<from Step 1>
INSTITUTIONAL_DOMAIN=example.edu.ph
ORG_NAME=Example University
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<from Step 2>
GOOGLE_CLIENT_SECRET=<from Step 2>
NEXT_PUBLIC_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback/google
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

- [ ] Save `.env.local`
- [ ] Run `npm run dev` to test
- [ ] Check browser console for no env var warnings
- [ ] Stop dev server (`Ctrl+C`)

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## PHASE 4: Run Database Migrations (30 min)

Go to Supabase Dashboard → SQL Editor. Run each migration in order:

### Migration 1: Roles Table
- [ ] Copy SQL from [SETUP_GUIDE.md](SETUP_GUIDE.md) - Migration 1
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run"
- [ ] Verify success (4 roles created)

### Migration 2: Organizations
- [ ] Copy SQL from [SETUP_GUIDE.md](SETUP_GUIDE.md) - Migration 2
- [ ] Paste and run
- [ ] Verify success

### Migration 3: Users
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 4: Content
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 5: Content Organizations
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 6: Audit Logs
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 7: Media Attachments
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 8: Notifications
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 9: Notification Preferences
- [ ] Copy SQL and run
- [ ] Verify success

### Migration 10: Content External Targets
- [ ] Copy SQL and run
- [ ] Verify success

### Verify All Tables Created
- [ ] Go to Database → Tables in Supabase
- [ ] Count tables: should see 10
  - [ ] roles
  - [ ] organizations
  - [ ] users
  - [ ] content
  - [ ] content_organizations
  - [ ] audit_logs
  - [ ] media_attachments
  - [ ] notifications
  - [ ] notification_preferences
  - [ ] content_external_targets

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## PHASE 5: Seed Initial Data (15 min)

### Create Organizations
- [ ] Go to Supabase → SQL Editor
- [ ] Copy SQL from [SETUP_GUIDE.md](SETUP_GUIDE.md) - Step 5a
- [ ] Paste and run
- [ ] Verify: go to Data Browser → organizations table
- [ ] Should see 7 organizations created

### Create SUPER_ADMIN User
- [ ] Go to Supabase → Authentication → Users
- [ ] Click "Add user"
- [ ] Email: use your institutional email (e.g., `admin@up.edu.ph`)
- [ ] Password: create strong password (8+ chars)
- [ ] Click "Create user"
- [ ] **Copy the User ID** (UUID)
- [ ] Go to SQL Editor and run: `SELECT id FROM organizations WHERE slug = 'up';`
- [ ] **Copy the organization ID** (UUID returned)
- [ ] Go to Data Browser → users table
- [ ] Click "Insert row"
- [ ] Fill in:
  - [ ] **id**: Paste User ID from step above
  - [ ] **email**: Same email as auth user creation
  - [ ] **display_name**: Your name or "System Administrator"
  - [ ] **avatar_url**: Leave blank
  - [ ] **role_id**: Select "SUPER_ADMIN" from dropdown
  - [ ] **org_id**: Select "University of the Philippines" from dropdown
- [ ] Click "Save"
- [ ] Verify: go to users table and see your row

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## PHASE 6: Start Development Server (5 min)

- [ ] Open terminal in project root
- [ ] Run: `npm install` (if dependencies not installed)
- [ ] Run: `npm run dev`
- [ ] Wait for server to start (should say "Ready in XXXms")
- [ ] Open browser: http://localhost:3000
- [ ] See login page
- [ ] Click "Sign in with Google"
- [ ] Use email from Phase 5 (your SUPER_ADMIN email)
- [ ] Verify you can log in
- [ ] Verify you see the dashboard

**Status: ☐ NOT STARTED | ☐ IN PROGRESS | ☐ COMPLETE**

---

## FINAL VERIFICATION

- [ ] All 6 phases complete
- [ ] Dev server running without errors: `npm run dev`
- [ ] Can log in as SUPER_ADMIN
- [ ] No console errors or warnings
- [ ] All 10 tables exist in Supabase
- [ ] All 7 organizations created
- [ ] SUPER_ADMIN user created and can log in

---

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| "Missing env var" | Make sure `.env.local` file exists and has all values |
| "Invalid Client ID" | Copy correct Google Client ID (ends with `.apps.googleusercontent.com`) |
| "RLS violation" | All 10 migrations must be run successfully |
| "Login fails" | Make sure SUPER_ADMIN user created in both auth and users table |
| "Page doesn't load" | Stop dev server (`Ctrl+C`) and restart (`npm run dev`) |

---

## Next Steps

✅ **All Phase 1 infrastructure is ready!**

1. Start Phase 1 feature development
2. Create API routes in `/app/api/`
3. Build React components in `/modules/*/components/`
4. Write tests with `npm test`

See [CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md) Section 18 for Phase 1 requirements.

---

**Estimated Total Time: 90 minutes**

Start time: ___________
End time: ___________
Duration: ___________

---

*CCIP Phase 1 Setup Checklist | Last Updated: March 4, 2026*
