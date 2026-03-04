/**
 * Roles Service
 * Handles all database interactions for role management
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IRole } from '@/shared/types/database.types';

/**
 * Get all roles
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
 */
export async function getRoleById(roleId: string): Promise<IRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('roles').select('*').eq('id', roleId).single();

  if (error) return null;
  return data as IRole;
}

/**
 * Get role by name
 */
export async function getRoleByName(
  name: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN'
): Promise<IRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('roles').select('*').eq('name', name).single();

  if (error) return null;
  return data as IRole;
}
