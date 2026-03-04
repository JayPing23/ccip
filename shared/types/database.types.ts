/**
 * Database Types
 * Auto-generated TypeScript interfaces for all database tables
 * Keep these in sync with the database schema
 */

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
    before: Record<string, any>;
    after: Record<string, any>;
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
  platform: 'facebook' | 'instagram';
  external_post_id: string | null;
  status: 'PENDING' | 'POSTED' | 'FAILED';
  error_log: string | null;
  retry_count: number;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}
