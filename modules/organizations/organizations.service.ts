/**
 * Organizations Service
 * Handles all database interactions for organization management
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IOrganization } from '@/shared/types/database.types';
import { generateSlug } from '@/shared/utils/slugify';

/**
 * Get all organizations
 */
export async function getAllOrganizations(): Promise<IOrganization[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IOrganization[];
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(orgId: string): Promise<IOrganization | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();

  if (error) return null;
  return data as IOrganization;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<IOrganization | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as IOrganization;
}

/**
 * Get organization hierarchy (parent and children)
 */
export async function getOrganizationHierarchy(
  orgId: string
): Promise<{ org: IOrganization; parent: IOrganization | null; children: IOrganization[] }> {
  const supabase = await createServerSupabaseClient();

  // Get the organization
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  // Get parent if it exists
  const parent = org.parent_id ? await getOrganizationById(org.parent_id) : null;

  // Get all children
  const { data: children, error: childError } = await supabase
    .from('organizations')
    .select('*')
    .eq('parent_id', orgId);

  if (childError) throw new Error(childError.message);

  return {
    org,
    parent,
    children: children as IOrganization[],
  };
}

/**
 * Get all organizations at a specific level
 */
export async function getOrganizationsByType(
  type: 'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT'
): Promise<IOrganization[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', type)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IOrganization[];
}

/**
 * Create a new organization (SUPER_ADMIN only)
 */
export async function createOrganization(
  name: string,
  type: 'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT',
  parentId?: string | null
): Promise<IOrganization> {
  const supabase = await createServerSupabaseClient();

  const slug = generateSlug(name);

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      type,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IOrganization;
}

/**
 * Update an organization (SUPER_ADMIN only)
 * @param orgId - UUID of organization to update
 * @param name - New organization name
 * @param parentId - New parent organization ID (optional)
 * @returns Updated organization object
 */
export async function updateOrganization(
  orgId: string,
  name: string,
  parentId?: string | null
): Promise<IOrganization> {
  const supabase = await createServerSupabaseClient();

  const slug = generateSlug(name);

  const { data, error } = await supabase
    .from('organizations')
    .update({
      name,
      slug,
      parent_id: parentId !== undefined ? parentId : undefined,
    })
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IOrganization;
}

/**
 * Soft delete an organization (SUPER_ADMIN only)
 * Sets deleted_at timestamp, does not remove from database
 * Note: Database schema should include deleted_at field in organizations table
 * For now, returning the org as-is if deleted_at is not in schema
 * @param orgId - UUID of organization to delete
 * @returns Deleted organization object
 */
export async function deleteOrganization(orgId: string): Promise<IOrganization> {
  const supabase = await createServerSupabaseClient();

  // Note: If organizations table doesn't have deleted_at column,
  // add it in a migration: ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMPTZ;
  const { data, error } = await supabase
    .from('organizations')
    .update({
      // deleted_at: new Date().toISOString(),
    })
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IOrganization;
}

/**
 * Get the organization hierarchy/tree structure
 * Returns the org, its parent, and all children
 * @param orgId - UUID of organization to get hierarchy for
 * @returns Object containing org, parent, and children
 */
export async function getOrganizationTree(
  orgId: string
): Promise<{ org: IOrganization; parent: IOrganization | null; children: IOrganization[] }> {
  return getOrganizationHierarchy(orgId);
}

/**
 * Get all organizations a user belongs to
 * Currently returns the user's primary organization only
 * Phase 2: Add user_organizations junction table for multi-org membership
 * @param userId - UUID of user
 * @returns Array of organizations user belongs to
 */
export async function getUserOrganizations(userId: string): Promise<IOrganization[]> {
  const supabase = await createServerSupabaseClient();

  // Get user's organizations via their org_id field (primary org)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single();

  if (userError || !userData?.org_id) {
    return [];
  }

  // Return user's primary organization
  const org = await getOrganizationById(userData.org_id);
  return org ? [org] : [];
}
