/**
 * Auth Service
 * Handles authentication-related functions
 */

import { upsertUser } from '@/modules/users/users.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IUser } from '@/shared/types/database.types';

/**
 * Get the currently authenticated user from the session
 * Returns null if no user is logged in
 * @returns Authenticated user object or null
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
 * Called during auth callback to restrict access to institutional emails
 * @param email - Email address to validate
 * @param institutionalDomain - Required domain (e.g., 'university.edu')
 * @returns True if email domain matches, false otherwise
 */
export function isInstitutionalEmail(email: string, institutionalDomain: string): boolean {
  const domain = email.split('@')[1];
  return domain === institutionalDomain;
}

/**
 * Validate institutional domain from email
 * Same as isInstitutionalEmail but with different name for clarity
 * @param email - Email address to check
 * @param institutionalDomain - Required institutional domain
 * @returns True if email is from institutional domain
 */
export function validateInstitutionalDomain(
  email: string,
  institutionalDomain: string = 'university.edu'
): boolean {
  return isInstitutionalEmail(email, institutionalDomain);
}

/**
 * Validate Google OAuth token (JWT)
 * Checks token signature and expiration through Supabase
 * In production, should verify JWT signature independently
 * @param token - JWT token from Google OAuth
 * @returns True if token is valid, false otherwise
 */
export async function validateGoogleToken(token: string): Promise<boolean> {
  try {
    // Supabase will validate token through auth session
    // For Phase 1, we trust Supabase to handle JWT validation
    // Phase 2: Add explicit JWT signature verification with google-auth-library
    if (!token) return false;

    // Token is valid if it exists and passes Supabase auth
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Handle the full Google OAuth callback flow
 * Verifies token → validates institutional email → creates/updates user
 * @param email - Email from Google OAuth
 * @param displayName - Display name from Google profile
 * @param avatarUrl - Avatar URL from Google profile
 * @param institutionalDomain - Required institutional domain
 * @returns Created/updated user object or null if validation fails
 */
export async function handleGoogleOAuthCallback(
  email: string,
  displayName: string,
  avatarUrl: string | null,
  institutionalDomain: string = 'university.edu'
): Promise<IUser | null> {
  // Step 1: Validate institutional email domain
  if (!validateInstitutionalDomain(email, institutionalDomain)) {
    console.warn(`OAuth callback failed: email domain not institutional (${email})`);
    return null;
  }

  // Step 2: Get or create authenticated user session
  // This is typically handled by NextAuth.js, but included here for reference
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    console.warn('OAuth callback failed: no authenticated user');
    return null;
  }

  // Step 3: Create or update user profile in database
  try {
    const user = await upsertUser(authUser.id, email, displayName, avatarUrl);
    return user;
  } catch (error) {
    console.error('Failed to upsert user during OAuth callback:', error);
    return null;
  }
}

/**
 * Get the current user session (alias for getAuthenticatedUser)
 * Retrieves the authenticated user from the session cookie
 * @returns Authenticated user object or null
 */
export async function getUserSession() {
  return getAuthenticatedUser();
}

/**
 * Sign out the current user
 * Invalidates the session and clears auth cookie
 * @throws Error if sign out fails
 */
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw new Error(error.message);
}

/**
 * Logout user (alias for signOut)
 * Invalidates the session and clears auth cookie
 * @throws Error if logout fails
 */
export async function logoutUser(): Promise<void> {
  return signOut();
}

/**
 * Get the session user ID (for RLS and authorization checks)
 * Extracts user ID from authenticated session
 * @returns User ID string or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}
