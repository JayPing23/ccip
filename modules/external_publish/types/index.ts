/**
 * External Publish Types (Phase 5)
 * Types for external distribution of institutional/editorial content.
 * External publishing applies to announcements and articles only — never forum content.
 */

export type ExternalPlatform = 'facebook' | 'instagram';

export type ExternalPublishStatus = 'PENDING' | 'POSTED' | 'FAILED';

export type ExternalPublishContentType = 'ANNOUNCEMENT' | 'ARTICLE';

export interface IExternalPublishTarget {
  id: string;
  content_id: string;
  content_type: ExternalPublishContentType;
  platform: ExternalPlatform;
  external_post_id: string | null;
  status: ExternalPublishStatus;
  error_log: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalPublishRequest {
  content_id: string;
  content_type: ExternalPublishContentType;
  platforms: ExternalPlatform[];
}

export interface ExternalPublishResult {
  target_id: string;
  platform: ExternalPlatform;
  status: ExternalPublishStatus;
  error?: string;
}

export interface ExternalPublishSummary {
  total: number;
  pending: number;
  posted: number;
  failed: number;
  targets: IExternalPublishTarget[];
}

export const EXTERNAL_PLATFORMS: ExternalPlatform[] = ['facebook', 'instagram'];

export const MAX_RETRY_COUNT = 3;

export const RETRY_DELAY_MS = 60_000; // 1 minute base delay
