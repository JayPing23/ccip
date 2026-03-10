/**
 * Comprehensive unit tests for shared/utils/permissions.ts
 *
 * Tests every exported permission function with every role to ensure
 * the RLS-mirroring application-layer authorization is correct.
 */

import { ROLES, type Role } from '@/shared/constants/roles';
import {
  canAccessAdminConsole,
  canAccessContentManager,
  canCreateArticle,
  canCreateContent,
  canCrossPost,
  canDeleteAnyArticle,
  canDeleteAnyContent,
  canDeleteOwnArticle,
  canDeleteOwnContent,
  canEditAnyArticle,
  canEditAnyContent,
  canEditOwnArticle,
  canEditOwnContent,
  canManageOrganizations,
  canManageRoles,
  canModerate,
  canPostInForum,
  canPublishArticle,
  canReviewArticle,
  canSchedulePosts,
  canUploadMedia,
  canViewAuditLogs,
  canViewContentAdministration,
} from '@/shared/utils/permissions';

const ALL_ROLES: Role[] = [
  ROLES.STUDENT,
  ROLES.DEPT_EDITOR,
  ROLES.UNIVERSITY_EDITOR,
  ROLES.SUPER_ADMIN,
];

// Helper: given a permission function, collect the roles that pass
function rolesAllowed(fn: (role: Role) => boolean): Role[] {
  return ALL_ROLES.filter(fn);
}

// ───────────────────────── Content Permissions ─────────────────────────

describe('Content Permissions', () => {
  const EDITOR_ROLES: Role[] = [ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN];

  describe('canCreateContent', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canCreateContent)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canCreateContent(ROLES.STUDENT)).toBe(false);
    });
    it.each(EDITOR_ROLES)('returns true for %s', (role) => {
      expect(canCreateContent(role)).toBe(true);
    });
  });

  describe('canEditOwnContent', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canEditOwnContent)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canEditOwnContent(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canEditAnyContent', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canEditAnyContent)).toEqual([ROLES.SUPER_ADMIN]);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR])('denies %s', (role) => {
      expect(canEditAnyContent(role)).toBe(false);
    });
  });

  describe('canDeleteOwnContent', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canDeleteOwnContent)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canDeleteOwnContent(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canDeleteAnyContent', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canDeleteAnyContent)).toEqual([ROLES.SUPER_ADMIN]);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR])('denies %s', (role) => {
      expect(canDeleteAnyContent(role)).toBe(false);
    });
  });
});

// ───────────────────────── Admin Permissions ─────────────────────────

describe('Admin Permissions', () => {
  const ADMIN_ONLY: Role[] = [ROLES.SUPER_ADMIN];
  const NON_ADMINS: Role[] = [ROLES.STUDENT, ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR];

  describe('canManageRoles', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canManageRoles)).toEqual(ADMIN_ONLY);
    });
    it.each(NON_ADMINS)('denies %s', (role) => {
      expect(canManageRoles(role)).toBe(false);
    });
  });

  describe('canManageOrganizations', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canManageOrganizations)).toEqual(ADMIN_ONLY);
    });
    it.each(NON_ADMINS)('denies %s', (role) => {
      expect(canManageOrganizations(role)).toBe(false);
    });
  });

  describe('canViewAuditLogs', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canViewAuditLogs)).toEqual(ADMIN_ONLY);
    });
    it.each(NON_ADMINS)('denies %s', (role) => {
      expect(canViewAuditLogs(role)).toBe(false);
    });
  });

  describe('canAccessAdminConsole', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canAccessAdminConsole)).toEqual(ADMIN_ONLY);
    });
    it.each(NON_ADMINS)('denies %s', (role) => {
      expect(canAccessAdminConsole(role)).toBe(false);
    });
  });
});

// ───────────────────────── Media & Scheduling ─────────────────────────

describe('Media & Scheduling Permissions', () => {
  const EDITOR_ROLES: Role[] = [ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN];

  describe('canUploadMedia', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canUploadMedia)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canUploadMedia(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canSchedulePosts', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canSchedulePosts)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canSchedulePosts(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canCrossPost', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canCrossPost)).toEqual([ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN]);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR])('denies %s', (role) => {
      expect(canCrossPost(role)).toBe(false);
    });
  });
});

// ───────────────────────── Publication Permissions ─────────────────────────

describe('Publication Permissions', () => {
  const EDITOR_ROLES: Role[] = [ROLES.DEPT_EDITOR, ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN];
  const ADMIN_ROLES: Role[] = [ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN];

  describe('canCreateArticle', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canCreateArticle)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canCreateArticle(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canEditOwnArticle', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canEditOwnArticle)).toEqual(EDITOR_ROLES);
    });
  });

  describe('canEditAnyArticle', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canEditAnyArticle)).toEqual(ADMIN_ROLES);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR])('denies %s', (role) => {
      expect(canEditAnyArticle(role)).toBe(false);
    });
  });

  describe('canReviewArticle', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canReviewArticle)).toEqual(ADMIN_ROLES);
    });
  });

  describe('canPublishArticle', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canPublishArticle)).toEqual(ADMIN_ROLES);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR])('denies %s', (role) => {
      expect(canPublishArticle(role)).toBe(false);
    });
  });

  describe('canDeleteOwnArticle', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canDeleteOwnArticle)).toEqual(EDITOR_ROLES);
    });
  });

  describe('canDeleteAnyArticle', () => {
    it('allows only SUPER_ADMIN', () => {
      expect(rolesAllowed(canDeleteAnyArticle)).toEqual([ROLES.SUPER_ADMIN]);
    });
  });

  describe('canAccessContentManager', () => {
    it('allows DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
      expect(rolesAllowed(canAccessContentManager)).toEqual(EDITOR_ROLES);
    });
    it('denies STUDENT', () => {
      expect(canAccessContentManager(ROLES.STUDENT)).toBe(false);
    });
  });

  describe('canViewContentAdministration', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canViewContentAdministration)).toEqual(ADMIN_ROLES);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR])('denies %s', (role) => {
      expect(canViewContentAdministration(role)).toBe(false);
    });
  });
});

// ───────────────────────── Forum Permissions ─────────────────────────

describe('Forum Permissions', () => {
  describe('canPostInForum', () => {
    it('allows all four roles', () => {
      expect(rolesAllowed(canPostInForum)).toEqual(ALL_ROLES);
    });
    it.each(ALL_ROLES)('allows %s', (role) => {
      expect(canPostInForum(role)).toBe(true);
    });
  });

  describe('canModerate', () => {
    it('allows only UNIVERSITY_EDITOR and SUPER_ADMIN', () => {
      expect(rolesAllowed(canModerate)).toEqual([ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN]);
    });
    it.each([ROLES.STUDENT, ROLES.DEPT_EDITOR])('denies %s', (role) => {
      expect(canModerate(role)).toBe(false);
    });
  });
});

// ───────────────────────── Role Constant Integrity ─────────────────────────

describe('ROLES constant', () => {
  it('has exactly four roles', () => {
    expect(Object.keys(ROLES)).toHaveLength(4);
  });

  it('contains STUDENT, DEPT_EDITOR, UNIVERSITY_EDITOR, SUPER_ADMIN', () => {
    expect(ROLES.STUDENT).toBe('STUDENT');
    expect(ROLES.DEPT_EDITOR).toBe('DEPT_EDITOR');
    expect(ROLES.UNIVERSITY_EDITOR).toBe('UNIVERSITY_EDITOR');
    expect(ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });

  it('key and value match for each role', () => {
    for (const [key, value] of Object.entries(ROLES)) {
      expect(key).toBe(value);
    }
  });
});
