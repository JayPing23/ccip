# CCIP Phase 1 Implementation Prompt
## 5 Core Tasks to Complete MVP

**Project:** Centralized Campus Information Portal (CCIP)
**Phase:** Phase 1 (MVP Core)
**Current Status:** 99% Complete (Testing remaining)
**Total Estimated Time:** ~12–15 hours
**Target Completion:** End of current development session

---

## TASK 1: Enable RLS Policies (~1 hour)
**Priority:** 🔴 HIGHEST — Blocks all API testing
**Status:** ✅ COMPLETE
**Objective:** Add Row-Level Security (RLS) policies to all 10 database tables

### What Needs to Be Done
1. **Enable RLS on all tables** (if not already enabled in migrations)
   - `roles` — Public read-only
   - `organizations` — Public read, user scoped write
   - `users` — Self-read, admin-write
   - `content` — Public read (by visibility rules), editor/admin write
   - `content_organizations` — Same as content
   - `audit_logs` — Admin read-only (immutable)
   - `media_attachments` — User-scoped read/write
   - `notifications` — User-scoped read/write
   - `notification_preferences` — User-scoped read/write
   - `content_external_targets` — Editor/admin read/write

2. **Write RLS policies** for each table:
   - **Create policy** for allowed operations (SELECT, INSERT, UPDATE, DELETE)
   - **Enforce institutional domain** where applicable
   - **Check role-based permissions** in policies
   - **Validate organization membership** for org-scoped operations

3. **Test RLS enforcement:**
   - Verify anonymous users cannot read private content
   - Verify students cannot edit content they don't own
   - Verify editors can only manage content in their organization
   - Verify admins have full access

### Success Criteria
- ✅ All 10 tables have RLS enabled in Supabase
- ✅ At least 2 policies per table (SELECT and INSERT/UPDATE/DELETE)
- ✅ Manual Supabase console test shows permissions working
- ✅ `npm run type-check` passes (no new type errors)

### Key Files to Modify
- `supabase/migrations/012_enable_rls_policies.sql` (NEW FILE)

### Reference
See [CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md) Section 9 (User Roles & Permissions) and Section 12 (Content Visibility Rules)

---

## TASK 2: Complete Service Layer (~2–3 hours)
**Priority:** 🔴 HIGHEST — Blocks API implementation
**Status:** ✅ COMPLETE
**Objective:** Finish all CRUD operations in service files with proper error handling and audit logging

### What Needs to Be Done

#### File: `modules/content/content.service.ts`
- [ ] Complete `createContent()` — Handle draft creation, validation, audit logging
- [ ] Implement `updateContent()` — Edit drafts/published, version tracking
- [ ] Implement `deleteContent()` — Soft delete, audit trail
- [ ] Implement `publishContent()` — Draft → Published, schedule release
- [ ] Implement `getContentByVisibility()` — Filter by user permissions
- [ ] Implement `getContentById()` — Retrieve single content
- [ ] Implement `getContentByOrganization()` — Org-scoped content
- [ ] Add audit log entry for all DML operations

#### File: `modules/users/users.service.ts`
- [ ] Complete `upsertUser()` — Create or update on first Google OAuth login
- [ ] Implement `getUserById()` — Retrieve user profile
- [ ] Implement `updateUser()` — Self-profile updates only
- [ ] Implement `assignUserRole()` — SUPER_ADMIN only, with validation
- [ ] Implement `changeUserOrganization()` — Move user to different org
- [ ] Add validation: institutional email domain check
- [ ] Add permission check: only SUPER_ADMIN can assign roles

#### File: `modules/organizations/organizations.service.ts`
- [ ] Implement `createOrganization()` — SUPER_ADMIN only, parent/child validation
- [ ] Implement `updateOrganization()` — Edit org details
- [ ] Implement `deleteOrganization()` — Soft delete (set deleted_at)
- [ ] Implement `getOrganizationTree()` — Return hierarchy (UNIVERSITY → SCHOOL → DEPT)
- [ ] Implement `getOrganizationById()` — Single org retrieval
- [ ] Implement `getUserOrganizations()` — Orgs user belongs to

#### File: `modules/auth/auth.service.ts`
- [ ] Implement `validateGoogleToken()` — Verify JWT authenticity
- [ ] Implement `validateInstitutionalDomain()` — Check email domain allowed
- [ ] Implement `handleGoogleOAuthCallback()` — Full flow: verify → create/update user
- [ ] Implement `getUserSession()` — Retrieve current session from auth cookie
- [ ] Implement `logoutUser()` — Invalidate session

#### File: `modules/roles/roles.service.ts`
- [ ] Implement `getAllRoles()` — Return all 4 roles with descriptions
- [ ] Implement `getRoleById()` — Retrieve single role
- [ ] Implement `checkUserPermission()` — Validate user can perform action

### Code Quality Requirements
- [ ] **Zero `any` types** — TypeScript strict mode
- [ ] **JSDoc comments** on all functions (parameter types, return type, description)
- [ ] **Error handling** — Throw specific API errors (not generic)
- [ ] **Audit logging** — All content mutations logged to `audit_logs` table
- [ ] **Permission validation** — Every write operation checks permissions first
- [ ] **Input validation** — Zod schema validation before DB operations

### Success Criteria
- ✅ All service files have complete CRUD operations
- ✅ All functions have parameter validation (Zod schemas)
- ✅ All write operations log to `audit_logs`
- ✅ Permission checks prevent unauthorized operations
- ✅ `npm run type-check` passes (zero type errors)
- ✅ Unit tests exist for at least 70% of functions

### Reference Files
- [shared/utils/validation.ts](shared/utils/validation.ts) — Zod schemas
- [shared/utils/api-errors.ts](shared/utils/api-errors.ts) — Error classes
- [shared/utils/permissions.ts](shared/utils/permissions.ts) — Permission checks

---

## TASK 3: Implement API Routes (~2–3 hours)
**Priority:** 🔴 HIGH — Required for frontend testing
**Status:** ✅ COMPLETE
**Objective:** Build all API endpoints that consume service layer functions

### What Needs to Be Done

#### Authentication Routes
- [ ] `app/api/auth/login/route.ts` — POST: initiate Google OAuth flow
- [ ] `app/api/auth/callback/google/route.ts` — GET: handle OAuth callback, set session
- [ ] `app/api/auth/logout/route.ts` — POST: clear session cookie
- [ ] `app/api/auth/me/route.ts` — GET: return current user profile (already exists, verify)

#### Content Routes
- [ ] `app/api/content/route.ts` — GET: list content (paginated, filtered) | POST: create (editor+)
- [ ] `app/api/content/[id]/route.ts` — GET: retrieve one | PATCH: update (owner/admin) | DELETE: soft delete (owner/admin)
- [ ] `app/api/content/[id]/publish/route.ts` — POST: transition DRAFT → PUBLISHED (owner/admin)
- [ ] `app/api/content/[id]/archive/route.ts` — POST: transition to ARCHIVED (owner/admin)

#### User Routes
- [ ] `app/api/users/route.ts` — GET: list all (SUPER_ADMIN only) | POST: create (SUPER_ADMIN only)
- [ ] `app/api/users/[id]/route.ts` — GET: retrieve profile | PATCH: update profile (self/admin)
- [ ] `app/api/users/[id]/role/route.ts` — POST: assign role (SUPER_ADMIN only)

#### Organization Routes
- [ ] `app/api/organizations/route.ts` — GET: list all | POST: create (SUPER_ADMIN only)
- [ ] `app/api/organizations/[id]/route.ts` — GET: retrieve one | PATCH: update (admin) | DELETE: soft delete (admin)

#### Roles Routes
- [ ] `app/api/roles/route.ts` — GET: list all 4 roles (public endpoint)

### API Response Format (ALL endpoints)
```typescript
// Success (200, 201)
{
  success: true,
  data: { /* response payload */ },
  message?: "Operation successful"
}

// Error (400, 401, 403, 500)
{
  success: false,
  error: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR",
    message: "Human-readable error message"
  }
}
```

### API Route Requirements
- [ ] **Authentication check** — Verify JWT token for protected routes
- [ ] **Permission validation** — Call service layer permission checks
- [ ] **Request validation** — Validate body/query with Zod schemas
- [ ] **Error handling** — Return standardized error responses
- [ ] **CORS headers** — Set appropriate headers (if cross-origin)
- [ ] **Rate limiting** — Consider adding rate limit headers (Phase 2)

### Success Criteria
- ✅ All 15+ endpoint routes created and functional
- ✅ Every route returns standardized response format
- ✅ Permission checks prevent unauthorized access
- ✅ Test with curl/Postman shows correct behavior
- ✅ `npm run dev` starts without errors
- ✅ TypeScript compilation passes

### Testing API Endpoints
```bash
# Test public endpoint (no auth)
curl http://localhost:3000/api/roles

# Test protected endpoint (requires session cookie)
curl -H "Cookie: __Secure-next-auth.session-token=..." \
  http://localhost:3000/api/auth/me

# Test creating content (POST)
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{"title":"...", "body":"...", "org_ids":["..."]}'
```

### Reference Files
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — Full endpoint specifications
- [shared/utils/api-response.ts](shared/utils/api-response.ts) — Response helper
- [shared/utils/api-errors.ts](shared/utils/api-errors.ts) — Error definitions

---

## TASK 4: Build Content Create/Edit Pages (~2–3 hours)
**Priority:** 🟡 MEDIUM-HIGH — Core user-facing feature
**Status:** ✅ COMPLETE
**Objective:** Create React pages and forms for content creation and editing

### What Needs to Be Done

#### Create Content Pages
- [x] `app/(portal)/content/create/page.tsx` — New announcement form
- [x] `modules/content/components/ContentForm.tsx` — Reusable form component
- [x] `modules/content/hooks/useContentForm.ts` — Form state & submission logic

#### Edit Content Pages
- [x] `app/(portal)/content/[slug]/edit/page.tsx` — Edit existing announcement
- [x] Logic to fetch content, populate form, handle updates

#### Form Features (ContentForm Component)
- [x] **Title input** — Required, max 200 chars
- [x] **Body/rich text** — Textarea for formatted text (Phase 3 enhancement)
- [x] **Organization selector** — Multi-select which orgs see this
- [x] **Visibility dropdown** — PUBLIC | ORG_ONLY | DEPT_ONLY
- [x] **Content tags** — Multi-select from predefined tags
- [x] **Status selector** — DRAFT | SCHEDULED | PUBLISHED
- [x] **Scheduled publish date** — Optional datetime picker
- [x] **Author display** — Show current user as author (read-only)
- [x] **Draft auto-save** — Save as draft every 30 seconds
- [x] **Submit buttons**:
  - "Save as Draft" (POST/PATCH with status=DRAFT)
  - "Publish Now" (POST/PATCH with status=PUBLISHED)
  - "Schedule for Later" (POST/PATCH with status=SCHEDULED + scheduled_at)

#### Form Validation
- [x] Use Zod schemas from `shared/utils/validation.ts`
- [x] Display inline error messages
- [x] Disable submit if form invalid
- [x] Show loading state during submission
- [x] Show success/error toast notifications

#### Error Handling
- [x] Handle 401 (unauthorized — redirect to login)
- [x] Handle 403 (forbidden — show error message)
- [x] Handle 400 (validation error — show field errors)
- [x] Handle 500 (server error — show retry button)

### UI Requirements
- [x] Responsive design (mobile-first with Tailwind)
- [x] Accessible form (proper labels, ARIA attributes)
- [x] Clear visual feedback (loading spinners, disabled states)
- [x] Consistent with project design system
- [x] Dark mode support (if Tailwind configured)

### Success Criteria
- [x] Create page allows filling out form and submitting
- [x] POST request sends correct data to `/api/content`
- [x] Response shows success/error message
- [x] Edit page pre-populates form with existing data
- [x] PATCH request updates content correctly
- [x] Validation errors display inline
- [x] Form auto-saves drafts periodically
- [x] `npm run dev` runs without errors

### Reference Files
- [modules/content/types/content.types.ts](modules/content/types/content.types.ts) — Content types
- [shared/utils/validation.ts](shared/utils/validation.ts) — Form schemas
- [shared/constants/content.ts](shared/constants/content.ts) — Status/visibility values

---

## TASK 5: Admin Pages (User, Organization, Role Management) (~3–4 hours)
**Priority:** 🟡 MEDIUM — Required for admin workflows
**Status:** ✅ COMPLETE
**Objective:** Create admin dashboard with user, organization, and role management

### What Needs to Be Done

#### Admin User Management Page
**Route:** `app/(portal)/admin/users/page.tsx`

- [ ] **User List Table**
  - Display all users (paginated, 20 per page)
  - Columns: Name | Email | Organization | Role | Joined Date | Actions
  - Sortable by: name, email, joined date
  - Filterable by: organization, role, status

- [ ] **User Detail Modal/Sidebar**
  - Show selected user's profile
  - Email (read-only)
  - Organization (dropdown to change)
  - Role (dropdown to change)
  - Status (active/inactive toggle)
  - Last login date
  - Edit button → Update form

- [ ] **Permission Checks**
  - Only SUPER_ADMIN can view this page
  - Only SUPER_ADMIN can change role/org
  - Non-admin users redirected to dashboard

#### Admin Organization Management Page
**Route:** `app/(portal)/admin/organizations/page.tsx`

- [ ] **Organization Tree View OR List**
  - Show hierarchy: UNIVERSITY → SCHOOLS → DEPARTMENTS
  - Expandable tree structure OR filtered list view
  - Show: Name | Type | Parent | Member Count | Actions

- [ ] **Organization CRUD**
  - **Create button** → Form to create new org
    - Name, Type (SCHOOL/DEPARTMENT), Parent org selector
  - **Edit** → Inline or modal form to update org
  - **Delete button** → Soft delete with confirmation

- [ ] **Organization Detail**
  - Show org info, members, content published count
  - Manage members (add/remove users to org)

#### Admin Role Management Page (Optional - Minimal)
**Route:** `app/(portal)/admin/roles/page.tsx`

- [ ] **Role List** (read-only view)
  - Display all 4 roles: STUDENT, DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN
  - Show permissions for each role
  - Show user count per role

- [ ] **Assignment History** (derived from audit_logs)
  - Show recent role assignments
  - Who assigned, when, to whom

#### Admin Dashboard
**Route:** `app/(portal)/admin/dashboard/page.tsx`

- [ ] **Statistics Cards**
  - Total users
  - Total content published
  - Total organizations
  - Recent activity count

- [ ] **Quick Links**
  - Link to user management
  - Link to organization management
  - Link to role management
  - Link to audit logs (if time permits)

- [ ] **Recent Activity Feed**
  - Last 10 audit log entries
  - Who did what, when

### Admin-Only Permission Checks
- [ ] Route protection — redirect non-SUPER_ADMIN away
- [ ] API call protection — verify SUPER_ADMIN role on server
- [ ] Form submission validation — only SUPER_ADMIN can mutate

### UI/UX Requirements
- [ ] Admin pages have distinct visual style (darker header, warning colors for danger actions)
- [ ] Confirmation dialogs for destructive actions (delete, role change)
- [ ] Loading states for all async operations
- [ ] Toast notifications for success/error
- [ ] Responsive tables (stack on mobile)
- [ ] Search/filter functionality where applicable

### Success Criteria
- ✅ Admin user can view all users and change roles
- ✅ Admin user can view organization hierarchy
- ✅ Admin user can create/edit/delete organizations
- ✅ Non-admin users cannot access admin pages (redirected)
- ✅ API calls validate admin permissions
- ✅ All forms submit correctly to `/api/*` endpoints
- ✅ Confirmation dialogs prevent accidental deletions
- ✅ Pages display loading state during data fetch
- ✅ `npm run dev` runs without errors

### Reference Files
- [modules/users/types/](modules/users/types/) — User types
- [modules/organizations/types/](modules/organizations/types/) — Organization types
- [shared/constants/roles.ts](shared/constants/roles.ts) — Role definitions

---

## Implementation Order & Dependencies

```
TASK 1: RLS Policies
    ↓
TASK 2: Service Layer
    ↓
TASK 3: API Routes (depends on Task 2)
    ↓
TASK 4: Content Pages (depends on Task 3)
    ↓
TASK 5: Admin Pages (depends on Task 3)
```

**Note:** Tasks 4 and 5 can run in parallel once Task 3 is complete.

---

## Testing Strategy

### After Each Task
1. **Type Check:** `npm run type-check`
2. **Unit Tests:** `npm run test` (coverage ≥ 70%)
3. **Manual Testing:** `npm run dev` + browser/curl testing

### Testing Checklist
- [ ] Happy path: normal user operations succeed
- [ ] Unhappy path: invalid input/permissions show errors
- [ ] Edge cases: empty states, pagination, sorting
- [ ] Security: unauthorized users cannot access restricted data
- [ ] Performance: queries don't return excessive data

---

## Success Criteria (Phase 1 Complete)

✅ All 5 tasks completed
✅ RLS policies active on all tables
✅ Service layer fully implemented
✅ API routes tested and working
✅ Content creation/editing works end-to-end
✅ Admin management pages functional
✅ TypeScript strict mode passes
✅ Zero console errors in dev server
✅ Unit test coverage ≥ 70%
✅ Project ready for Phase 2 (Notifications)

---

## Resources & References

- **Architecture Proposal:** [CCIP_PROJECT_PROPOSAL.md](CCIP_PROJECT_PROPOSAL.md)
- **VS Code Setup:** [CCIP_VSCODE_SETUP.md](CCIP_VSCODE_SETUP.md)
- **API Reference:** [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- **Database Schema:** Section 8 of CCIP_PROJECT_PROPOSAL.md
- **Permissions Model:** Section 9 of CCIP_PROJECT_PROPOSAL.md

---

**Last Updated:** March 9, 2026
**Prompt Version:** 1.0
**Status:** Ready for Implementation
