/**
 * Roles Service
 * Handles all database interactions for role management
 */

import type { Role } from '@/shared/constants/roles';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IRole } from '@/shared/types/database.types';
import {
  canCreateContent,
  canCrossPost,
  canDeleteAnyContent,
  canDeleteOwnContent,
  canEditAnyContent,
  canEditOwnContent,
  canManageOrganizations,
  canManageRoles,
  canSchedulePosts,
  canUploadMedia,
  canViewAuditLogs,
} from '@/shared/utils/permissions';

/**
 * Get all roles
 * @returns Array of all role objects from database
 */
export async function getAllRoles(): Promise<IRole[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IRole[];
}

/**
 * Get role by ID
 * @param roleId - UUID of role to retrieve
 * @returns Role object or null if not found
 */
export async function getRoleById(roleId: string): Promise<IRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('roles').select('*').eq('id', roleId).single();

  if (error) return null;
  return data as IRole;
}

/**
 * Get role by name
 * @param name - Role name to look up
 * @returns Role object or null if not found
 */
export async function getRoleByName(
  name: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN'
): Promise<IRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('roles').select('*').eq('name', name).single();

  if (error) return null;
  return data as IRole;
}

/**
 * Check if a user can perform a specific permission action
 * Validates user role against required permission
 * @param userRole - User's role (STUDENT | DEPT_EDITOR | UNIVERSITY_EDITOR | SUPER_ADMIN)
 * @param permission - Permission to check (e.g., 'create_content', 'manage_roles')
 * @returns True if user has permission, false otherwise
 */
export function checkUserPermission(userRole: Role, permission: string): boolean {
  switch (permission) {
    case 'create_content':
    case 'createContent':
      return canCreateContent(userRole);
    case 'edit_own_content':
    case 'editOwnContent':
      return canEditOwnContent(userRole);
    case 'edit_any_content':
    case 'editAnyContent':
      return canEditAnyContent(userRole);
    case 'delete_own_content':
    case 'deleteOwnContent':
      return canDeleteOwnContent(userRole);
    case 'delete_any_content':
    case 'deleteAnyContent':
      return canDeleteAnyContent(userRole);
    case 'manage_roles':
    case 'manageRoles':
      return canManageRoles(userRole);
    case 'manage_organizations':
    case 'manageOrganizations':
      return canManageOrganizations(userRole);
    case 'view_audit_logs':
    case 'viewAuditLogs':
      return canViewAuditLogs(userRole);
    case 'upload_media':
    case 'uploadMedia':
      return canUploadMedia(userRole);
    case 'schedule_posts':
    case 'schedulePosts':
      return canSchedulePosts(userRole);
    case 'cross_post':
    case 'crossPost':
      return canCrossPost(userRole);
    default:
      return false;
  }
}
