/**
 * Database Types
 * Auto-generated TypeScript interfaces for all database tables
 * Keep these in sync with the database schema
 */

import type { ContentTag } from '@/shared/constants/tags';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IRole {
  id: string;
  name: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN';
  created_at: string;
}

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  type: 'UNIVERSITY' | 'SCHOOL' | 'DEPARTMENT';
  parent_id: string | null;
  created_at: string;
}

export interface IUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role_id: string;
  role_name?: 'STUDENT' | 'DEPT_EDITOR' | 'UNIVERSITY_EDITOR' | 'SUPER_ADMIN';
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IContent {
  id: string;
  title: string;
  body: string;
  slug: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY';
  author_id: string;
  tags?: ContentTag[];
  /** Generated tsvector column — present in DB rows but normally excluded from API responses. */
  search_vector?: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  deleted_at: string | null;
}

export interface IContentOrganization {
  content_id: string;
  org_id: string;
  created_at: string;
}

export interface IAuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id: string | null;
  diff: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  } | null;
  created_at: string;
}

export interface INotification {
  id: string;
  user_id: string;
  content_id: string | null;
  type: 'IN_APP' | 'EMAIL_IMMEDIATE' | 'EMAIL_DAILY' | 'EMAIL_WEEKLY';
  notification_text: string | null;
  read_at: string | null;
  created_at: string;
}

export interface INotificationPreference {
  user_id: string;
  org_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_digest: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
  created_at: string;
  updated_at: string;
}

export interface IMediaAttachment {
  id: string;
  content_id: string | null;
  file_name: string;
  file_type: 'image' | 'pdf' | 'document';
  file_size_bytes: number;
  storage_path: string;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export interface IContentExternalTarget {
  id: string;
  content_id: string;
  content_type: 'ANNOUNCEMENT' | 'ARTICLE';
  platform: 'facebook' | 'instagram';
  external_post_id: string | null;
  status: 'PENDING' | 'POSTED' | 'FAILED';
  error_log: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Publication domain (Phase 3 – additive, separate from announcements)
// ---------------------------------------------------------------------------

export interface IArticle {
  id: string;
  title: string;
  body: string;
  slug: string;
  excerpt: string | null;
  section: 'NEWS' | 'FEATURES' | 'OPINION' | 'EDITORIAL' | 'SPORTS' | 'CULTURE';
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  author_id: string;
  reviewer_id: string | null;
  review_note: string | null;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IArticleAuthor {
  article_id: string;
  user_id: string;
  role: 'primary' | 'contributor';
  byline_name: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Forum domain (Phase 4 – additive, separate from announcements/publication)
// ---------------------------------------------------------------------------

export interface IForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface IForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  body: string;
  slug: string;
  status: 'OPEN' | 'LOCKED' | 'HIDDEN' | 'REMOVED';
  pinned: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  status: 'VISIBLE' | 'HIDDEN' | 'REMOVED';
  parent_reply_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IForumReaction {
  id: string;
  user_id: string;
  thread_id: string | null;
  reply_id: string | null;
  reaction_type: 'LIKE' | 'HELPFUL' | 'INSIGHTFUL';
  created_at: string;
}

// ---------------------------------------------------------------------------
// Moderation domain (Phase 4 – ships alongside forum, not after it)
// ---------------------------------------------------------------------------

export interface IModerationReport {
  id: string;
  reporter_id: string;
  content_type: 'THREAD' | 'REPLY';
  content_id: string;
  reason: 'SPAM' | 'HARASSMENT' | 'MISINFORMATION' | 'OFF_TOPIC' | 'INAPPROPRIATE' | 'OTHER';
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface IModerationAction {
  id: string;
  moderator_id: string;
  report_id: string | null;
  content_type: 'THREAD' | 'REPLY';
  content_id: string;
  action: 'HIDE' | 'LOCK' | 'REMOVE' | 'WARN';
  reason: string;
  created_at: string;
}

export interface IUserRestriction {
  id: string;
  user_id: string;
  restriction_type: 'MUTED' | 'SUSPENDED' | 'BANNED';
  reason: string;
  issued_by: string;
  starts_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Analytics domain (Phase 5 – platform-wide metrics and reporting)
// ---------------------------------------------------------------------------

export interface IContentView {
  id: string;
  content_type: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';
  content_id: string;
  user_id: string | null;
  viewed_at: string;
}

export interface IAnalyticsDailySnapshot {
  id: string;
  snapshot_date: string;
  total_users: number;
  active_users: number;
  new_users: number;
  announcements_published: number;
  articles_published: number;
  forum_threads_created: number;
  forum_replies_created: number;
  content_views: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Retention domain (Phase 5 – content lifecycle management)
// ---------------------------------------------------------------------------

export interface IRetentionPolicy {
  id: string;
  content_type: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';
  stale_after_days: number;
  auto_archive_after_days: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
