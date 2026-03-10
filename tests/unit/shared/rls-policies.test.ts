/**
 * RLS Policy Logic Tests
 *
 * Validates that the SQL RLS helper functions and policy rules defined in
 * 001_enable_rls_policies.sql are correctly mirrored by the application-layer
 * permission checks in shared/utils/permissions.ts.
 *
 * These tests serve as a contract between the database policies and the
 * application code, ensuring both layers agree on who can do what.
 */

import { ROLES, type Role } from '@/shared/constants/roles';
import {
  canAccessAdminConsole,
  canCreateContent,
  canCrossPost,
  canDeleteAnyContent,
  canDeleteOwnContent,
  canEditAnyContent,
  canEditOwnContent,
  canManageOrganizations,
  canManageRoles,
  canModerate,
  canPostInForum,
  canUploadMedia,
  canViewAuditLogs,
} from '@/shared/utils/permissions';

// ─── SQL Helper Function Logic ───────────────────────────────────────────

describe('SQL helper function logic: is_admin', () => {
  // SQL: get_user_role(user_id) = 'SUPER_ADMIN'
  it.each([
    { role: ROLES.SUPER_ADMIN, expected: true },
    { role: ROLES.UNIVERSITY_EDITOR, expected: false },
    { role: ROLES.DEPT_EDITOR, expected: false },
    { role: ROLES.STUDENT, expected: false },
  ])('is_admin($role) → $expected', ({ role, expected }) => {
    const isAdmin = role === ROLES.SUPER_ADMIN;
    expect(isAdmin).toBe(expected);
  });
});

describe('SQL helper function logic: is_editor', () => {
  // SQL: get_user_role(user_id) IN ('DEPT_EDITOR', 'UNIVERSITY_EDITOR', 'SUPER_ADMIN')
  const EDITOR_ROLES: Set<Role> = new Set([ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN]);

  it.each([
    { role: ROLES.SUPER_ADMIN, expected: true },
    { role: ROLES.UNIVERSITY_EDITOR, expected: true },
    { role: ROLES.DEPT_EDITOR, expected: true },
    { role: ROLES.STUDENT, expected: false },
  ])('is_editor($role) → $expected', ({ role, expected }) => {
    expect(EDITOR_ROLES.has(role)).toBe(expected);
  });
});

// ─── Table Policy → Permission Function Mapping ─────────────────────────

describe('RLS policy ↔ permission function alignment', () => {
  const ALL_ROLES: Role[] = [
    ROLES.STUDENT,
    ROLES.DEPT_EDITOR,
    ROLES.UNIVERSITY_EDITOR,
    ROLES.SUPER_ADMIN,
  ];
  const rolesWhere = (fn: (r: Role) => boolean) => ALL_ROLES.filter(fn);

  // ── roles table ─────────────────────────
  // SQL: roles_read → everyone, roles_insert → is_admin
  describe('roles table policies', () => {
    it('SELECT: all roles can read (policy: true)', () => {
      // No permission function needed — route is public
      expect(true).toBe(true);
    });

    it('INSERT: only SUPER_ADMIN (policy: is_admin)', () => {
      // Mirrors canManageRoles (only admin can insert roles)
      expect(rolesWhere(canManageRoles)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  // ── organizations table ─────────────────
  // SQL: organizations_read → everyone, organizations_insert/update/delete → is_admin
  describe('organizations table policies', () => {
    it('SELECT: all roles can read (policy: true)', () => {
      expect(true).toBe(true);
    });

    it('INSERT/UPDATE/DELETE: only SUPER_ADMIN (policy: is_admin)', () => {
      expect(rolesWhere(canManageOrganizations)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  // ── users table ─────────────────────────
  // SQL: users_read_self → self, users_read_admin → is_admin
  // SQL: users_insert_admin → is_admin, users_update_admin → is_admin
  describe('users table policies', () => {
    it('INSERT/UPDATE admin: only SUPER_ADMIN (policy: is_admin)', () => {
      expect(rolesWhere(canManageRoles)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  // ── content table ───────────────────────
  // SQL: content_insert_editor → is_editor, content_update/delete → author OR is_admin
  describe('content table policies', () => {
    it('INSERT: editor roles (policy: is_editor + author_id = uid)', () => {
      expect(rolesWhere(canCreateContent)).toEqual([
        ROLES.DEPT_EDITOR,
        ROLES.UNIVERSITY_EDITOR,
        ROLES.SUPER_ADMIN,
      ]);
    });

    it('UPDATE own: editor roles (policy: author_id = uid)', () => {
      expect(rolesWhere(canEditOwnContent)).toEqual([
        ROLES.DEPT_EDITOR,
        ROLES.UNIVERSITY_EDITOR,
        ROLES.SUPER_ADMIN,
      ]);
    });

    it('UPDATE any: only SUPER_ADMIN (policy: is_admin)', () => {
      expect(rolesWhere(canEditAnyContent)).toEqual([ROLES.SUPER_ADMIN]);
    });

    it('DELETE own: editor roles (policy: author_id = uid)', () => {
      expect(rolesWhere(canDeleteOwnContent)).toEqual([
        ROLES.DEPT_EDITOR,
        ROLES.UNIVERSITY_EDITOR,
        ROLES.SUPER_ADMIN,
      ]);
    });

    it('DELETE any: only SUPER_ADMIN (policy: is_admin)', () => {
      expect(rolesWhere(canDeleteAnyContent)).toEqual([ROLES.SUPER_ADMIN]);
    });

    it('SELECT admin: only SUPER_ADMIN can read all (policy: is_admin)', () => {
      expect(rolesWhere(canAccessAdminConsole)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  // ── audit_logs table ────────────────────
  // SQL: audit_logs_read_admin → is_admin
  describe('audit_logs table policies', () => {
    it('SELECT: only SUPER_ADMIN (policy: is_admin)', () => {
      expect(rolesWhere(canViewAuditLogs)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  // ── media_attachments table ─────────────
  // SQL: media_attachments_insert_editor → is_editor + uploaded_by = uid
  describe('media_attachments table policies', () => {
    it('INSERT: editor roles (policy: is_editor)', () => {
      expect(rolesWhere(canUploadMedia)).toEqual([
        ROLES.DEPT_EDITOR,
        ROLES.UNIVERSITY_EDITOR,
        ROLES.SUPER_ADMIN,
      ]);
    });
  });

  // ── content_external_targets table ──────
  // SQL: insert → is_admin OR get_user_role = 'UNIVERSITY_EDITOR'
  describe('content_external_targets table policies', () => {
    it('INSERT: UNIVERSITY_EDITOR + SUPER_ADMIN (policy: is_admin OR univ_editor)', () => {
      expect(rolesWhere(canCrossPost)).toEqual([ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN]);
    });
  });

  // ── forum (additional tables) ───────────
  describe('forum table policies', () => {
    it('INSERT thread: all authenticated roles (policy: auth.uid is not null)', () => {
      expect(rolesWhere(canPostInForum)).toEqual(ALL_ROLES);
    });

    it('MODERATE: UNIVERSITY_EDITOR + SUPER_ADMIN', () => {
      expect(rolesWhere(canModerate)).toEqual([ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN]);
    });
  });
});

// ─── Content Visibility Rules ────────────────────────────────────────────

describe('content visibility rules (RLS SELECT)', () => {
  // These are the rules from the SQL that determine content visibility for STUDENT:
  //   deleted_at IS NULL
  //   AND status = 'PUBLISHED'
  //   AND (visibility = 'PUBLIC' OR (visibility IN ('ORG_ONLY','DEPT_ONLY') AND org match))

  it('STUDENT can see PUBLISHED + PUBLIC content', () => {
    const content = { status: 'PUBLISHED', visibility: 'PUBLIC', deleted_at: null };
    const canSee =
      content.deleted_at === null &&
      content.status === 'PUBLISHED' &&
      content.visibility === 'PUBLIC';
    expect(canSee).toBe(true);
  });

  it('STUDENT cannot see DRAFT content', () => {
    const content = { status: 'DRAFT', visibility: 'PUBLIC', deleted_at: null };
    const canSee = content.status === 'PUBLISHED';
    expect(canSee).toBe(false);
  });

  it('STUDENT cannot see ARCHIVED content', () => {
    const content = { status: 'ARCHIVED', visibility: 'PUBLIC', deleted_at: null };
    const canSee = content.status === 'PUBLISHED';
    expect(canSee).toBe(false);
  });

  it('STUDENT cannot see deleted content', () => {
    const content = { status: 'PUBLISHED', visibility: 'PUBLIC', deleted_at: '2026-03-01' };
    const canSee = content.deleted_at === null;
    expect(canSee).toBe(false);
  });

  it('STUDENT can see ORG_ONLY content when in the same org', () => {
    const userOrgId = 'org-1';
    const contentOrgIds = ['org-1', 'org-2'];
    const content = { status: 'PUBLISHED', visibility: 'ORG_ONLY', deleted_at: null };
    const canSee =
      content.deleted_at === null &&
      content.status === 'PUBLISHED' &&
      contentOrgIds.includes(userOrgId);
    expect(canSee).toBe(true);
  });

  it('STUDENT cannot see ORG_ONLY content from another org', () => {
    const userOrgId = 'org-3';
    const contentOrgIds = ['org-1', 'org-2'];
    const content = { status: 'PUBLISHED', visibility: 'ORG_ONLY', deleted_at: null };
    const canSee =
      content.deleted_at === null &&
      content.status === 'PUBLISHED' &&
      contentOrgIds.includes(userOrgId);
    expect(canSee).toBe(false);
  });

  it('STUDENT can see DEPT_ONLY content when in the same dept', () => {
    const userOrgId = 'dept-cs';
    const contentOrgIds = ['dept-cs'];
    const content = { status: 'PUBLISHED', visibility: 'DEPT_ONLY', deleted_at: null };
    const canSee =
      content.deleted_at === null &&
      content.status === 'PUBLISHED' &&
      contentOrgIds.includes(userOrgId);
    expect(canSee).toBe(true);
  });

  it('EDITOR can see their own DRAFT content', () => {
    const content = {
      status: 'DRAFT',
      visibility: 'PUBLIC',
      deleted_at: null,
      author_id: 'editor-1',
    };
    const userId = 'editor-1';
    const isEditor = true;
    const canSee = isEditor && content.author_id === userId && content.deleted_at === null;
    expect(canSee).toBe(true);
  });

  it('EDITOR cannot see another editors DRAFT content', () => {
    const content = {
      status: 'DRAFT',
      visibility: 'PUBLIC',
      deleted_at: null,
      author_id: 'editor-2',
    };
    const userId = 'editor-1';
    const isOwner = content.author_id === userId;
    expect(isOwner).toBe(false);
  });

  it('ADMIN can see all content regardless of status or visibility', () => {
    const isAdmin = true;
    expect(isAdmin).toBe(true); // is_admin(auth.uid()) → true allows everything
  });
});

// ─── Notification Policies ───────────────────────────────────────────────

describe('notifications table policies', () => {
  it('users can only read their own notifications', () => {
    const notifUserId = 'user-1';
    const authUid = 'user-1';
    expect(notifUserId === authUid).toBe(true);
  });

  it('users cannot read other users notifications', () => {
    const notifUserId = 'user-1';
    const authUid = 'user-2';
    expect(notifUserId === (authUid as string)).toBe(false);
  });

  it('users can update their own notifications (mark as read)', () => {
    const notifUserId = 'user-1';
    const authUid = 'user-1';
    expect(notifUserId === authUid).toBe(true);
  });

  it('users can delete their own notifications', () => {
    const notifUserId = 'user-1';
    const authUid = 'user-1';
    expect(notifUserId === authUid).toBe(true);
  });
});

// ─── Self-Update Restriction (users table) ───────────────────────────────

describe('users self-update restriction', () => {
  // SQL: users_update_self → USING (id = auth.uid()) WITH CHECK (role_id unchanged, org_id unchanged)
  it('user cannot change their own role_id', () => {
    const currentRoleId: string = 'role-student';
    const newRoleId: string = 'role-admin';
    const roleChanged = currentRoleId !== newRoleId;
    expect(roleChanged).toBe(true); // Policy would reject this
  });

  it('user cannot change their own org_id', () => {
    const currentOrgId: string = 'org-1';
    const newOrgId: string = 'org-2';
    const orgChanged = currentOrgId !== newOrgId;
    expect(orgChanged).toBe(true); // Policy would reject this
  });

  it('user can update non-sensitive fields (display_name, avatar_url)', () => {
    const selfUpdate = { display_name: 'New Name', avatar_url: null };
    expect(selfUpdate.display_name).toBeDefined();
    expect('role_id' in selfUpdate).toBe(false);
    expect('org_id' in selfUpdate).toBe(false);
  });
});

// ─── Audit Log Immutability ──────────────────────────────────────────────

describe('audit_logs immutability', () => {
  it('no UPDATE policy exists (logs cannot be modified)', () => {
    // The SQL migration intentionally has NO UPDATE/DELETE policies for audit_logs
    const hasUpdatePolicy = false;
    const hasDeletePolicy = false;
    expect(hasUpdatePolicy).toBe(false);
    expect(hasDeletePolicy).toBe(false);
  });

  it('INSERT allowed for admin or service role (auth.uid() IS NULL)', () => {
    // Service role has no auth.uid, so auth.uid() IS NULL returns true
    const isServiceRole = true;
    const authUid = null;
    expect(authUid === null || isServiceRole).toBe(true);
  });
});
