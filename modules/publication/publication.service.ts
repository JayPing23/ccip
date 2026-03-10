/**
 * Publication Service
 * Handles all database interactions for the publication (campus news) module.
 * Follows the same patterns as content.service.ts but operates on the
 * separate `articles` / `article_authors` tables.
 */

import type { ArticleSection, ArticleStatus } from '@/modules/publication/constants';
import type { IArticle, IArticleAuthor } from '@/modules/publication/types';
import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase-server';
import { appendUuidToSlug, generateSlug } from '@/shared/utils/slugify';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all published articles (reader-facing).
 */
export async function getPublishedArticles(
  limit = 20,
  offset = 0
): Promise<IArticle[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data as IArticle[];
}

/**
 * Get articles for the editorial workspace (filtered by author or all).
 */
export async function getManagedArticles(
  userId: string,
  includeAll: boolean,
  filters: { status?: ArticleStatus; section?: ArticleSection } = {}
): Promise<IArticle[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase.from('articles').select('*').is('deleted_at', null);

  if (!includeAll) {
    query = query.eq('author_id', userId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.section) {
    query = query.eq('section', filters.section);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as IArticle[];
}

/**
 * Get a single article by ID.
 */
export async function getArticleById(articleId: string): Promise<IArticle | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IArticle) : null;
}

/**
 * Get a single article by slug.
 */
export async function getArticleBySlug(slug: string): Promise<IArticle | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IArticle) : null;
}

/**
 * Get byline authors for an article.
 */
export async function getArticleAuthors(articleId: string): Promise<IArticleAuthor[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('article_authors')
    .select('*')
    .eq('article_id', articleId)
    .order('role', { ascending: true });

  if (error) throw new Error(error.message);
  return data as IArticleAuthor[];
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

async function articleSlugExists(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

async function uniqueArticleSlug(title: string): Promise<string> {
  let slug = generateSlug(title);
  while (await articleSlugExists(slug)) {
    slug = appendUuidToSlug(slug);
  }
  return slug;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface CreateArticleInput {
  title: string;
  body?: string;
  excerpt?: string | null;
  section: ArticleSection;
  status?: ArticleStatus;
  byline_name?: string;
}

/**
 * Create a new draft article.
 */
export async function createArticle(
  input: CreateArticleInput,
  userId: string
): Promise<IArticle> {
  const supabase = await createServerSupabaseClient();
  const slug = await uniqueArticleSlug(input.title);

  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: input.title,
      body: input.body ?? '',
      slug,
      excerpt: input.excerpt ?? null,
      section: input.section,
      status: input.status ?? 'DRAFT',
      author_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const article = data as IArticle;

  // Add primary author byline
  if (input.byline_name) {
    await addArticleAuthor(article.id, userId, 'primary', input.byline_name);
  }

  await logAuditEvent('articles', article.id, 'INSERT', userId, null, article);
  return article;
}

/**
 * Update article fields.
 */
export async function updateArticle(
  articleId: string,
  updates: Partial<Pick<IArticle, 'title' | 'body' | 'excerpt' | 'section' | 'status'>>,
  userId: string
): Promise<IArticle> {
  const supabase = createServiceRoleClient();

  const before = await getArticleById(articleId);
  if (!before) throw new Error('Article not found');

  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'PUBLISHED' && before.status !== 'PUBLISHED') {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('articles')
    .update(payload)
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const article = data as IArticle;

  await logAuditEvent('articles', articleId, 'UPDATE', userId, before, article);
  return article;
}

/**
 * Soft-delete an article.
 */
export async function deleteArticle(articleId: string, userId: string): Promise<IArticle> {
  const supabase = createServiceRoleClient();

  const before = await getArticleById(articleId);
  if (!before) throw new Error('Article not found');

  const { data, error } = await supabase
    .from('articles')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const article = data as IArticle;

  await logAuditEvent('articles', articleId, 'DELETE', userId, before, article);
  return article;
}

// ---------------------------------------------------------------------------
// Editorial Workflow Actions
// ---------------------------------------------------------------------------

/**
 * Submit article for editorial review (DRAFT → IN_REVIEW).
 */
export async function submitArticleForReview(
  articleId: string,
  userId: string
): Promise<IArticle> {
  const article = await getArticleById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.status !== 'DRAFT') {
    throw new Error('Only draft articles can be submitted for review');
  }
  return updateArticle(articleId, { status: 'IN_REVIEW' }, userId);
}

/**
 * Approve article after review (IN_REVIEW → APPROVED).
 */
export async function approveArticle(
  articleId: string,
  reviewerId: string,
  reviewNote?: string
): Promise<IArticle> {
  const supabase = createServiceRoleClient();

  const before = await getArticleById(articleId);
  if (!before) throw new Error('Article not found');
  if (before.status !== 'IN_REVIEW') {
    throw new Error('Only articles in review can be approved');
  }

  const { data, error } = await supabase
    .from('articles')
    .update({
      status: 'APPROVED',
      reviewer_id: reviewerId,
      review_note: reviewNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const article = data as IArticle;

  await logAuditEvent('articles', articleId, 'UPDATE', reviewerId, before, article);
  return article;
}

/**
 * Send article back to draft from review (IN_REVIEW → DRAFT).
 */
export async function requestArticleRevision(
  articleId: string,
  reviewerId: string,
  reviewNote: string
): Promise<IArticle> {
  const supabase = createServiceRoleClient();

  const before = await getArticleById(articleId);
  if (!before) throw new Error('Article not found');
  if (before.status !== 'IN_REVIEW') {
    throw new Error('Only articles in review can be sent back for revision');
  }

  const { data, error } = await supabase
    .from('articles')
    .update({
      status: 'DRAFT',
      reviewer_id: reviewerId,
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const article = data as IArticle;

  await logAuditEvent('articles', articleId, 'UPDATE', reviewerId, before, article);
  return article;
}

/**
 * Publish an approved article (APPROVED → PUBLISHED).
 */
export async function publishArticle(
  articleId: string,
  userId: string
): Promise<IArticle> {
  const article = await getArticleById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.status !== 'APPROVED') {
    throw new Error('Only approved articles can be published');
  }
  return updateArticle(articleId, { status: 'PUBLISHED' }, userId);
}

/**
 * Archive an article (any active status → ARCHIVED).
 */
export async function archiveArticle(
  articleId: string,
  userId: string
): Promise<IArticle> {
  const article = await getArticleById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.status === 'ARCHIVED') {
    throw new Error('Article is already archived');
  }
  return updateArticle(articleId, { status: 'ARCHIVED' }, userId);
}

// ---------------------------------------------------------------------------
// Byline Author Management
// ---------------------------------------------------------------------------

export async function addArticleAuthor(
  articleId: string,
  userId: string,
  role: 'primary' | 'contributor',
  bylineName: string
): Promise<IArticleAuthor> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('article_authors')
    .insert({
      article_id: articleId,
      user_id: userId,
      role,
      byline_name: bylineName,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IArticleAuthor;
}

export async function removeArticleAuthor(
  articleId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('article_authors')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Audit helper (mirrors content.service.ts pattern)
// ---------------------------------------------------------------------------

async function logAuditEvent(
  tableName: string,
  recordId: string,
  action: string,
  userId: string,
  before: object | null,
  after: object | null
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    user_id: userId,
    diff: { before, after },
  });

  if (error) {
    console.error('Failed to log audit event:', error);
  }
}
