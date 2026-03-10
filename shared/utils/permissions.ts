/**
 * Permission Check Functions
 * Use these functions for all permission authorization checks.
 * Never inline role string comparisons in components or API routes.
 */

import { ROLES, type Role } from '@/shared/constants/roles';

const CONTENT_EDITOR_ROLES: Role[] = [
  ROLES.DEPT_EDITOR,
  ROLES.UNIVERSITY_EDITOR,
  ROLES.SUPER_ADMIN,
];

const CONTENT_ADMINISTRATION_ROLES: Role[] = [ROLES.UNIVERSITY_EDITOR, ROLES.SUPER_ADMIN];

/**
 * Check if a user can create content (any content, any org)
 */
export function canCreateContent(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can edit their own content
 */
export function canEditOwnContent(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
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
  return CONTENT_EDITOR_ROLES.includes(role);
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
 * Check if a user can access the admin console.
 */
export function canAccessAdminConsole(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can upload media attachments
 */
export function canUploadMedia(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can schedule posts
 */
export function canSchedulePosts(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can cross-post to external platforms
 */
export function canCrossPost(role: Role): boolean {
  return CONTENT_ADMINISTRATION_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Publication (Phase 3) permissions
// ---------------------------------------------------------------------------

/**
 * Check if a user can create publication articles (campus news).
 * All editor roles can draft articles.
 */
export function canCreateArticle(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can edit their own articles.
 */
export function canEditOwnArticle(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can edit any article (editorial oversight).
 */
export function canEditAnyArticle(role: Role): boolean {
  return CONTENT_ADMINISTRATION_ROLES.includes(role);
}

/**
 * Check if a user can review / approve articles.
 */
export function canReviewArticle(role: Role): boolean {
  return CONTENT_ADMINISTRATION_ROLES.includes(role);
}

/**
 * Check if a user can publish approved articles.
 */
export function canPublishArticle(role: Role): boolean {
  return CONTENT_ADMINISTRATION_ROLES.includes(role);
}

/**
 * Check if a user can delete (soft-delete) their own articles.
 */
export function canDeleteOwnArticle(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can delete any article.
 */
export function canDeleteAnyArticle(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if a user can access the announcement management workspace.
 */
export function canAccessContentManager(role: Role): boolean {
  return CONTENT_EDITOR_ROLES.includes(role);
}

/**
 * Check if a user can review the full announcement management list.
 */
export function canViewContentAdministration(role: Role): boolean {
  return CONTENT_ADMINISTRATION_ROLES.includes(role);
}
