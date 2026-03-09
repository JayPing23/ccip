/**
 * Content Service
 * Handles all database interactions for the content module
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IContent } from '@/shared/types/database.types';
import { appendUuidToSlug, generateSlug } from '@/shared/utils/slugify';

/**
 * Get all published content visible to the current user
 * Filtered by visibility rules and soft delete status
 */
export async function getPublishedContent() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as IContent[];
}

/**
 * Get a single content item by ID
 */
export async function getContentById(contentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('content').select('*').eq('id', contentId).single();

  if (error) throw new Error(error.message);
  return data as IContent;
}

/**
 * Get a single content item by slug
 */
export async function getContentBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('content').select('*').eq('slug', slug).single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as IContent) || null;
}

/**
 * Check if a slug already exists
 */
export async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Create a new content item
 * Automatically creates audit log entry
 */
export async function createContent(
  title: string,
  body: string,
  status: string,
  visibility: string,
  orgIds: string[],
  userId: string,
  scheduledAt?: string | null
) {
  const supabase = await createServerSupabaseClient();

  // For Phase 1, skip HTML sanitization (DOMPurify is client-side only)
  // TODO: Add server-side HTML sanitization in Phase 2 with a library like sanitize-html

  // Generate unique slug
  let slug = generateSlug(title);
  while (await slugExists(slug)) {
    slug = appendUuidToSlug(slug);
  }

  // Create content
  const { data: contentData, error: contentError } = await supabase
    .from('content')
    .insert({
      title,
      body,
      slug,
      status,
      visibility,
      author_id: userId,
      scheduled_at: scheduledAt || null,
      published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (contentError) throw new Error(contentError.message);
  const content = contentData as IContent;

  // Link to organizations (only if org_ids provided)
  if (orgIds && orgIds.length > 0) {
    const contentOrgLinks = orgIds.map((orgId) => ({
      content_id: content.id,
      org_id: orgId,
    }));

    const { error: linkError } = await supabase
      .from('content_organizations')
      .insert(contentOrgLinks);

    if (linkError) throw new Error(linkError.message);
  }

  // Audit log
  await logAuditEvent('content', content.id, 'INSERT', userId, null, content);

  return content;
}

/**
 * Update an existing content item
 * Automatically creates audit log entry
 */
export async function updateContent(contentId: string, updates: Partial<IContent>, userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get before state for audit log
  const before = await getContentById(contentId);

  // Set updated_at
  updates.updated_at = new Date().toISOString();

  // If transitioning to PUBLISHED, set published_at
  if (updates.status === 'PUBLISHED' && before.status !== 'PUBLISHED') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const content = data as IContent;

  // Audit log
  await logAuditEvent('content', contentId, 'UPDATE', userId, before, content);

  return content;
}

/**
 * Soft delete a content item
 * Sets deleted_at timestamp, does not remove from DB
 */
export async function deleteContent(contentId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const before = await getContentById(contentId);

  const { data, error } = await supabase
    .from('content')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const content = data as IContent;

  // Audit log
  await logAuditEvent('content', contentId, 'DELETE', userId, before, content);

  return content;
}

/**
 * Publish a content item (transition DRAFT → PUBLISHED)
 * Sets published_at timestamp and status to PUBLISHED
 * @param contentId - UUID of content to publish
 * @param userId - UUID of user performing the action
 * @returns Published content object
 */
export async function publishContent(contentId: string, userId: string): Promise<IContent> {
  return updateContent(
    contentId,
    {
      status: 'PUBLISHED',
    },
    userId
  );
}

/**
 * Archive a content item (transition to ARCHIVED)
 * Sets status to ARCHIVED - content is hidden but not deleted
 * @param contentId - UUID of content to archive
 * @param userId - UUID of user performing the action
 * @returns Archived content object
 */
export async function archiveContent(contentId: string, userId: string): Promise<IContent> {
  return updateContent(
    contentId,
    {
      status: 'ARCHIVED',
    },
    userId
  );
}

/**
 * Get content filtered by visibility rules and user permissions
 * Respects content visibility: PUBLIC, ORG_ONLY, DEPT_ONLY
 * @param _userId - UUID of current user (null for anonymous) - RLS handled at DB level
 * @param _userRole - User's role for permission checks - RLS handled at DB level
 * @param _userOrgId - User's primary organization - RLS handled at DB level
 * @param limit - Number of results to return
 * @param offset - Pagination offset
 * @returns Array of accessible content items
 */
export async function getContentByVisibility(
  _userId: string | null,
  _userRole: string,
  _userOrgId: string | null,
  limit: number = 20,
  offset: number = 0
): Promise<IContent[]> {
  const supabase = await createServerSupabaseClient();

  // Start with base query: non-deleted, published only
  let query = supabase.from('content').select('*').eq('status', 'PUBLISHED').is('deleted_at', null);

  // RLS and visibility rules are enforced at database level
  // This function trusts RLS policies to filter results
  // PUBLIC content is visible to all
  // ORG_ONLY/DEPT_ONLY requires user to be in that org (checked by RLS)

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data as IContent[];
}

/**
 * Get all content belonging to a specific organization
 * Filtered by org_id through content_organizations junction table
 * @param orgId - UUID of organization
 * @param includeArchived - Whether to include ARCHIVED content
 * @returns Array of content items
 */
export async function getContentByOrganization(
  orgId: string,
  includeArchived: boolean = false
): Promise<IContent[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('content')
    .select('*, content_organizations!inner(org_id)')
    .eq('content_organizations.org_id', orgId)
    .is('deleted_at', null);

  if (!includeArchived) {
    query = query.neq('status', 'ARCHIVED');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as IContent[];
}

/**
 * Log an audit event for content mutations
 * Internal helper — called automatically by CRUD functions
 * @param _tableName - Name of table being modified
 * @param recordId - UUID of record being modified
 * @param action - Type of action: INSERT, UPDATE, DELETE
 * @param userId - UUID of user performing action
 * @param before - State before change (null for INSERT)
 * @param after - State after change (null for DELETE)
 */
async function logAuditEvent(
  _tableName: string,
  recordId: string,
  action: string,
  userId: string,
  before: any,
  after: any
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('audit_logs').insert({
    content_id: recordId,
    actor_id: userId,
    action,
    diff: {
      before,
      after,
    },
  });

  if (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw — audit log failure should not block the mutation
  }
}
