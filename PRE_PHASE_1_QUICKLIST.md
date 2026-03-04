# CCIP Pre-Phase 1 — Quick Checklist (Printable)

**Status:** NOT STARTED | **Est. Time:** 3.5 hours | **Target:** This week

---

## PRIORITY 1: INFRASTRUCTURE (Prerequisites for database)

**Time: 40 minutes | Must be done first**

### 1.1 Supabase Project
- [ ] Create free account at https://supabase.com
- [ ] Create new project (wait for initialization)
- [ ] Copy NEXT_PUBLIC_SUPABASE_URL
- [ ] Copy NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Copy SUPABASE_SERVICE_ROLE_KEY

**Estimated time: 15 min**

### 1.2 Google OAuth
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials (Web app)
- [ ] Set authorized domains: `INSTITUTIONAL_DOMAIN`
- [ ] Add credentials to Supabase Authentication → Providers → Google

**Estimated time: 20 min**

### 1.3 Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Paste Supabase URL and keys
- [ ] Set INSTITUTIONAL_DOMAIN
- [ ] Verify .env.local is in .gitignore
- [ ] Test: `npm run dev` (should start without errors)

**Estimated time: 5 min**

---

## PRIORITY 2: DATABASE (Schema and initial data)

**Time: 60 minutes | Must be done second**

### 2.1 Create Migrations (11 files, copy-paste from PRE_PHASE_1_SETUP.md Section 2.1)
- [ ] 001_create_roles_table.sql
- [ ] 002_create_organizations_table.sql
- [ ] 003_create_users_table.sql
- [ ] 004_create_content_table.sql
- [ ] 005_create_content_organizations_table.sql
- [ ] 006_create_audit_logs_table.sql
- [ ] 007_create_media_attachments_table.sql
- [ ] 008_create_notifications_table.sql
- [ ] 009_create_notification_preferences_table.sql
- [ ] 010_create_content_external_targets_table.sql

**How:** Go to Supabase SQL Editor → paste each migration → Run

**Estimated time: 45 min**

### 2.2 Seed Initial Data
- [ ] Run 011_seed_organizations.sql (creates 1 University, 2 Schools, 2 Departments)
- [ ] Create SUPER_ADMIN user manually:
  - Go to Auth → Users → Add user
  - Use your institutional email
  - Copy user ID
  - Insert row in `users` table with that user ID + SUPER_ADMIN role_id
- [ ] Test: Log in as SUPER_ADMIN → should work

**Estimated time: 15 min**

### 2.3 Verify RLS
- [ ] Go to Authentication → Policies
- [ ] Verify ALL 10 tables have RLS enabled
- [ ] Verify policies exist for SELECT, INSERT, UPDATE, DELETE

**Estimated time: 10 min**

---

## PRIORITY 3: CODE SETUP (Types, utilities, services)

**Time: 105 minutes | Can overlap with Priority 2 if you have two windows open**

### 3.1 Shared Types (15 min)
- [ ] Create `shared/types/database.types.ts`
- [ ] Copy code from PRE_PHASE_1_SETUP.md Section 4.1
- [ ] All 10 interfaces: IRole, IOrganization, IUser, IContent, IContentOrganization, IAuditLog, INotification, INotificationPreference, IMediaAttachment, IContentExternalTarget

### 3.2 Shared Utilities (20 min)
- [ ] Create `shared/utils/permissions.ts` (10 permission check functions)
- [ ] Create `shared/utils/slugify.ts` (slug generation)
- [ ] Create `shared/utils/validation.ts` (Zod schemas)
- [ ] Test: `npm run type-check` (should pass)

### 3.3 Service Layer (60 min)
- [ ] Create `modules/content/content.service.ts` (CRUD + audit logging)
- [ ] Create `modules/users/users.service.ts`
- [ ] Create `modules/organizations/organizations.service.ts`
- [ ] Create `modules/auth/auth.service.ts`
- [ ] Create `modules/roles/roles.service.ts`
- [ ] Test: `npm run type-check` (should pass)

### 3.4 API Response Format (10 min)
- [ ] Create `shared/utils/api-response.ts` (response wrapper)
- [ ] Create `shared/utils/api-errors.ts` (error codes & status)
- [ ] Test: `npm run type-check` (should pass)

---

## PRIORITY 4: TESTING & DOCS

**Time: 40 minutes | Good to do but lower priority**

### 4.1 Jest Configuration (5 min)
- [ ] Create `jest.config.js`
- [ ] Create `jest.setup.js`
- [ ] Test: `npm test` (should run with 0 tests found)

### 4.2 README (15 min)
- [ ] Create `README.md` (copy from PRE_PHASE_1_SETUP.md Section 6.1)
- [ ] Update with your GitHub repo link

### 4.3 CONTRIBUTING (10 min)
- [ ] Create `CONTRIBUTING.md` (copy from PRE_PHASE_1_SETUP.md Section 6.2)

### 4.4 Storage Buckets (Optional - 5 min)
- [ ] Go to Supabase Storage → Create bucket `content-images` (Private, 5 MB limit)
- [ ] Create bucket `content-attachments` (Private, 20 MB limit)

---

## FINAL VERIFICATION

**Run these checks in order:**

```bash
npm run type-check        # ✅ Should pass (zero errors)
npm run lint              # ✅ Should pass (zero errors)
npm run format:check      # ✅ Should pass (all formatted)
npm run dev               # ✅ Should start at http://localhost:3000
```

**Manual checks:**
- [ ] Dev server starts without errors
- [ ] Can navigate to http://localhost:3000
- [ ] Google OAuth login button appears
- [ ] Can log in with SUPER_ADMIN account
- [ ] No secrets in git: `git log -p | grep -i "key\|secret"` (should show nothing)

---

## GO / NO-GO DECISION

### Prerequisites for Phase 1 GO:
- ✅ All 4 priorities above are DONE
- ✅ All verification checks PASS
- ✅ Can see login page
- ✅ Can log in as SUPER_ADMIN
- ✅ `git status` is clean

### If ANY of the above are incomplete:
- ❌ NO-GO: Do not start Phase 1 yet
- Go back to PRE_PHASE_1_SETUP.md and complete the step

---

## WHEN PRE-PHASE-1 IS COMPLETE:

```bash
git add .
git commit -m "chore: pre-phase-1 setup complete"
git push origin dev
```

Then: **Start Phase 1 development** per CCIP_PROJECT_PROPOSAL.md Section 18

---

## HELP

**Lost?** → Read `PRE_PHASE_1_SETUP.md` (detailed guide with all code)
**Questions?** → Check `CCIP_PROJECT_PROPOSAL.md` (project spec)
**Confused about tools?** → Check `CCIP_VSCODE_SETUP.md` (extension setup)

---

**Estimated Total Time: 3.5 hours**
**Recommended: Break into 2-3 sessions**
**Blocker Priority: Must finish Priority 1 & 2 before Phase 1 starts**

Good luck! 🚀

---

*Quick Checklist | CCIP Pre-Phase 1 | Print this page or keep it open while working*
