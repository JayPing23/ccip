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
