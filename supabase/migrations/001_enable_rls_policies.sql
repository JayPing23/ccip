-- ============================================================================
-- RLS (Row-Level Security) Policies for CCIP
-- ============================================================================
-- Enables RLS on all tables and creates security policies for different roles
--
-- Roles:
--   - STUDENT: Read published content only
--   - DEPT_EDITOR: Create/edit content in their department
--   - UNIVERSITY_EDITOR: Create/edit content for entire university
--   - SUPER_ADMIN: Full access to all tables
--
-- All policies enforce institutional security by checking:
--   - User's role (from users.role_id -> roles.name)
--   - User's organization (from users.org_id)
--   - Content visibility (PUBLIC, ORG_ONLY, DEPT_ONLY)
-- ============================================================================

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get the role name for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT r.name
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = user_id;
$$ LANGUAGE SQL STABLE;

-- Check if user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_user_role(user_id) = 'SUPER_ADMIN';
$$ LANGUAGE SQL STABLE;

-- Check if user is an editor (DEPT_EDITOR, UNIVERSITY_EDITOR, or SUPER_ADMIN)
CREATE OR REPLACE FUNCTION is_editor(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_user_role(user_id) IN ('DEPT_EDITOR', 'UNIVERSITY_EDITOR', 'SUPER_ADMIN');
$$ LANGUAGE SQL STABLE;

-- Get the user's organization ID
CREATE OR REPLACE FUNCTION get_user_org_id(user_id UUID)
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TABLE: roles
-- Policy: Public read-only (everyone can see available roles)
-- ============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated users) can read roles
DROP POLICY IF EXISTS "roles_read" ON roles;
CREATE POLICY "roles_read" ON roles
  FOR SELECT
  USING (true);

-- Only super admin can insert roles (should not happen in normal flow, but secured)
DROP POLICY IF EXISTS "roles_insert" ON roles;
CREATE POLICY "roles_insert" ON roles
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- TABLE: organizations
-- Policy: Public read, admin-only write
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizations
DROP POLICY IF EXISTS "organizations_read" ON organizations;
CREATE POLICY "organizations_read" ON organizations
  FOR SELECT
  USING (true);

-- Only super admin can create organizations
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only super admin can update organizations
DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE
  WITH CHECK (is_admin(auth.uid()));

-- Only super admin can delete organizations
DROP POLICY IF EXISTS "organizations_delete" ON organizations;
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- TABLE: users
-- Policy: Self-read + admin write
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "users_read_self" ON users;
CREATE POLICY "users_read_self" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Super admin can read all users
DROP POLICY IF EXISTS "users_read_admin" ON users;
CREATE POLICY "users_read_admin" ON users
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can update their own profile (non-critical fields only)
-- NOTE: role_id and org_id updates are restricted to admins via policy
DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role_id = (SELECT role_id FROM users WHERE id = auth.uid())  -- Cannot change own role
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())    -- Cannot change own org
  );

-- Only super admin can insert users
DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only super admin can update user roles and organizations
DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- TABLE: content
-- Policy: Public read (by visibility rules), editor/admin write
-- ============================================================================

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- STUDENTS: Read only PUBLISHED, non-deleted, PUBLIC or visible to their org content
DROP POLICY IF EXISTS "content_read_student" ON content;
CREATE POLICY "content_read_student" ON content
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
          WHERE co.org_id = get_user_org_id(auth.uid())
        )
      )
    )
  );

-- EDITORS: Can read PUBLISHED content + their own content (any status)
DROP POLICY IF EXISTS "content_read_editor" ON content;
CREATE POLICY "content_read_editor" ON content
  FOR SELECT
  USING (
    is_editor(auth.uid()) AND
    (
      -- Own content (any status, if not deleted)
      (
        author_id = auth.uid()
        AND deleted_at IS NULL
      )
      OR (
        -- PUBLISHED content visible to the org
        deleted_at IS NULL
        AND status = 'PUBLISHED'
        AND (
          visibility = 'PUBLIC'
          OR id IN (
            SELECT co.content_id FROM content_organizations co
            WHERE co.org_id = get_user_org_id(auth.uid())
          )
        )
      )
    )
  );

-- ADMINS: Can read all content
DROP POLICY IF EXISTS "content_read_admin" ON content;
CREATE POLICY "content_read_admin" ON content
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only editors (DEPT_EDITOR+) can create content
DROP POLICY IF EXISTS "content_insert_editor" ON content;
CREATE POLICY "content_insert_editor" ON content
  FOR INSERT
  WITH CHECK (
    is_editor(auth.uid())
    AND author_id = auth.uid()
  );

-- Only content author or admin can update content
DROP POLICY IF EXISTS "content_update_author" ON content;
CREATE POLICY "content_update_author" ON content
  FOR UPDATE
  USING (
    (author_id = auth.uid() OR is_admin(auth.uid()))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    (author_id = auth.uid() OR is_admin(auth.uid()))
    AND author_id = (SELECT author_id FROM content WHERE id = id)  -- Cannot change author
  );

-- Only content author or admin can soft-delete (set deleted_at)
DROP POLICY IF EXISTS "content_delete_author" ON content;
CREATE POLICY "content_delete_author" ON content
  FOR DELETE
  USING (
    (author_id = auth.uid() OR is_admin(auth.uid()))
    AND deleted_at IS NULL
  );

-- ============================================================================
-- TABLE: content_organizations
-- Policy: Same as content (editors can manage org associations for their content)
-- ============================================================================

ALTER TABLE content_organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read content_organizations (needed to filter content visibility)
DROP POLICY IF EXISTS "content_organizations_read" ON content_organizations;
CREATE POLICY "content_organizations_read" ON content_organizations
  FOR SELECT
  USING (true);

-- Only editors can insert content_organizations (when creating/editing content)
DROP POLICY IF EXISTS "content_organizations_insert" ON content_organizations;
CREATE POLICY "content_organizations_insert" ON content_organizations
  FOR INSERT
  WITH CHECK (
    is_editor(auth.uid())
    AND content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid()
    )
  );

-- Only content author or admin can update
DROP POLICY IF EXISTS "content_organizations_update" ON content_organizations;
CREATE POLICY "content_organizations_update" ON content_organizations
  FOR UPDATE
  USING (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  )
  WITH CHECK (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  );

-- Only content author or admin can delete
DROP POLICY IF EXISTS "content_organizations_delete" ON content_organizations;
CREATE POLICY "content_organizations_delete" ON content_organizations
  FOR DELETE
  USING (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  );

-- ============================================================================
-- TABLE: audit_logs
-- Policy: Admin read-only (immutable, no writes)
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
DROP POLICY IF EXISTS "audit_logs_read_admin" ON audit_logs;
CREATE POLICY "audit_logs_read_admin" ON audit_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only the system (service role) can insert audit logs
-- NOTE: This policy allows INSERT from auth.uid() IS NULL (service role)
-- In practice, audits should be created via database trigger or service-side function
DROP POLICY IF EXISTS "audit_logs_insert_admin" ON audit_logs;
CREATE POLICY "audit_logs_insert_admin" ON audit_logs
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid()) OR auth.uid() IS NULL
  );

-- Audit logs cannot be updated or deleted
-- (No UPDATE/DELETE policies defined intentionally)

-- ============================================================================
-- TABLE: media_attachments
-- Policy: User-scoped read/write (can only access own attachments)
-- ============================================================================

ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Users can read attachments they uploaded or on content they can access
DROP POLICY IF EXISTS "media_attachments_read_owner" ON media_attachments;
CREATE POLICY "media_attachments_read_owner" ON media_attachments
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR content_id IN (
      SELECT id FROM content WHERE
        (
          -- Own content
          author_id = auth.uid()
        )
        OR (
          -- Published content they have access to
          deleted_at IS NULL
          AND status = 'PUBLISHED'
          AND (
            visibility = 'PUBLIC'
            OR id IN (
              SELECT co.content_id FROM content_organizations co
              WHERE co.org_id = get_user_org_id(auth.uid())
            )
          )
        )
    )
  );

-- Admins can read all attachments
DROP POLICY IF EXISTS "media_attachments_read_admin" ON media_attachments;
CREATE POLICY "media_attachments_read_admin" ON media_attachments
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only editors can upload attachments
DROP POLICY IF EXISTS "media_attachments_insert_editor" ON media_attachments;
CREATE POLICY "media_attachments_insert_editor" ON media_attachments
  FOR INSERT
  WITH CHECK (
    is_editor(auth.uid())
    AND uploaded_by = auth.uid()
    AND content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid()
    )
  );

-- Only the uploader or admin can delete attachments
DROP POLICY IF EXISTS "media_attachments_delete_owner" ON media_attachments;
CREATE POLICY "media_attachments_delete_owner" ON media_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid() OR is_admin(auth.uid())
  );

-- ============================================================================
-- TABLE: notifications
-- Policy: User-scoped read/write (users can only access their own notifications)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "notifications_read_self" ON notifications;
CREATE POLICY "notifications_read_self" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- System (service role) can insert notifications
-- NOTE: In practice, notifications are created via service role or trigger
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid()) OR auth.uid() IS NULL
  );

-- Users can update their own notifications (e.g., mark as read)
DROP POLICY IF EXISTS "notifications_update_self" ON notifications;
CREATE POLICY "notifications_update_self" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_self" ON notifications;
CREATE POLICY "notifications_delete_self" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: notification_preferences
-- Policy: User-scoped read/write
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own notification preferences
DROP POLICY IF EXISTS "notification_preferences_read_self" ON notification_preferences;
CREATE POLICY "notification_preferences_read_self" ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all notification preferences
DROP POLICY IF EXISTS "notification_preferences_read_admin" ON notification_preferences;
CREATE POLICY "notification_preferences_read_admin" ON notification_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can only insert/update their own preferences
DROP POLICY IF EXISTS "notification_preferences_insert_self" ON notification_preferences;
CREATE POLICY "notification_preferences_insert_self" ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_update_self" ON notification_preferences;
CREATE POLICY "notification_preferences_update_self" ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
DROP POLICY IF EXISTS "notification_preferences_delete_self" ON notification_preferences;
CREATE POLICY "notification_preferences_delete_self" ON notification_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: content_external_targets
-- Policy: Editor/admin read/write
-- ============================================================================

ALTER TABLE content_external_targets ENABLE ROW LEVEL SECURITY;

-- Editors can read external targets for their own content
DROP POLICY IF EXISTS "content_external_targets_read_editor" ON content_external_targets;
CREATE POLICY "content_external_targets_read_editor" ON content_external_targets
  FOR SELECT
  USING (
    is_editor(auth.uid())
    AND content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid()
    )
  );

-- Admins can read all external targets
DROP POLICY IF EXISTS "content_external_targets_read_admin" ON content_external_targets;
CREATE POLICY "content_external_targets_read_admin" ON content_external_targets
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only editors (UNIVERSITY_EDITOR+) and admins can insert external targets
DROP POLICY IF EXISTS "content_external_targets_insert_editor" ON content_external_targets;
CREATE POLICY "content_external_targets_insert_editor" ON content_external_targets
  FOR INSERT
  WITH CHECK (
    (is_admin(auth.uid()) OR get_user_role(auth.uid()) = 'UNIVERSITY_EDITOR')
    AND content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid()
    )
  );

-- Only content author or admin can update external targets
DROP POLICY IF EXISTS "content_external_targets_update_editor" ON content_external_targets;
CREATE POLICY "content_external_targets_update_editor" ON content_external_targets
  FOR UPDATE
  USING (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  )
  WITH CHECK (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  );

-- Only content author or admin can delete external targets
DROP POLICY IF EXISTS "content_external_targets_delete_editor" ON content_external_targets;
CREATE POLICY "content_external_targets_delete_editor" ON content_external_targets
  FOR DELETE
  USING (
    content_id IN (
      SELECT id FROM content WHERE author_id = auth.uid() OR is_admin(auth.uid())
    )
  );

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
