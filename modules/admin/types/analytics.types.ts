/**
 * Analytics Types (Phase 5)
 * Types for platform analytics, content metrics, and admin reporting.
 */

// ---------------------------------------------------------------------------
// Content view tracking
// ---------------------------------------------------------------------------

export type ViewableContentType = 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';

export interface IContentView {
  id: string;
  content_type: ViewableContentType;
  content_id: string;
  user_id: string | null;
  viewed_at: string;
}

// ---------------------------------------------------------------------------
// Daily analytics snapshots (materialised aggregates for admin reporting)
// ---------------------------------------------------------------------------

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
// Admin analytics API response shapes
// ---------------------------------------------------------------------------

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalAnnouncements: number;
  totalArticles: number;
  totalThreads: number;
  totalReplies: number;
  totalViews: number;
}

export interface AnalyticsTrend {
  date: string;
  announcements: number;
  articles: number;
  threads: number;
  replies: number;
  views: number;
  activeUsers: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  trends: AnalyticsTrend[];
}

// ---------------------------------------------------------------------------
// Analytics query parameters
// ---------------------------------------------------------------------------

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month';
}
