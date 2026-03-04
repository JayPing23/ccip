/**
 * Auth Service
 * Handles authentication-related functions
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';

/**
 * Get the currently authenticated user from the session
 * Returns null if no user is logged in
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Validate that the user's email domain matches the institutional domain
 * Called during auth callback
 */
export function isInstitutionalEmail(email: string, institutionalDomain: string): boolean {
  const domain = email.split('@')[1];
  return domain === institutionalDomain;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw new Error(error.message);
}

/**
 * Get the session user ID (for RLS and authorization checks)
 */
export async function getUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}
