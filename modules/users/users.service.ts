/**
 * Users Service
 * Handles all database interactions for user management
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(): Promise<IUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();

  if (error) return null;
  return data as IUser;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) return null;
  return data as IUser;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error) return null;
  return data as IUser;
}

/**
 * Create or update user profile on auth signup
 * Called by auth trigger on new user creation
 */
export async function upsertUser(
  userId: string,
  email: string,
  displayName: string,
  avatarUrl?: string | null,
  roleId?: string
) {
  const supabase = await createServerSupabaseClient();

  // Get default STUDENT role ID if not provided
  let finalRoleId = roleId;
  if (!finalRoleId) {
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'STUDENT')
      .single();
    finalRoleId = roleData?.id;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        avatar_url: avatarUrl || null,
        role_id: finalRoleId,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IUser;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string | null
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .update({
      display_name: displayName,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IUser;
}

/**
 * Change user role (SUPER_ADMIN only)
 */
export async function changeUserRole(userId: string, newRoleId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .update({
      role_id: newRoleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IUser;
}
