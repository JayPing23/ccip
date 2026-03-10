/**
 * Analytics Service (Phase 5)
 * Provides platform-wide metrics and reporting for the admin dashboard.
 */

import type {
  AnalyticsOverview,
  AnalyticsQueryParams,
  AnalyticsResponse,
  AnalyticsTrend,
} from '@/modules/admin/types/analytics.types';
import { createServiceRoleClient } from '@/shared/lib/supabase-server';

// ---------------------------------------------------------------------------
// Overview: aggregate counts across all modules
// ---------------------------------------------------------------------------

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const supabase = createServiceRoleClient();

  const [usersRes, contentRes, articlesRes, threadsRes, repliesRes, viewsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null),
    supabase
      .from('forum_threads')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('forum_replies')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('content_views').select('id', { count: 'exact', head: true }),
  ]);

  // Count active users as those with at least one view in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsersRes = await supabase
    .from('content_views')
    .select('user_id')
    .gte('viewed_at', thirtyDaysAgo.toISOString())
    .not('user_id', 'is', null);

  const uniqueActiveUsers = new Set(
    (activeUsersRes.data ?? []).map((row: { user_id: string }) => row.user_id)
  );

  return {
    totalUsers: usersRes.count ?? 0,
    activeUsers: uniqueActiveUsers.size,
    totalAnnouncements: contentRes.count ?? 0,
    totalArticles: articlesRes.count ?? 0,
    totalThreads: threadsRes.count ?? 0,
    totalReplies: repliesRes.count ?? 0,
    totalViews: viewsRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Trends: time-series from analytics_daily_snapshots
// ---------------------------------------------------------------------------

export async function getAnalyticsTrends(
  params: AnalyticsQueryParams = {}
): Promise<AnalyticsTrend[]> {
  const supabase = createServiceRoleClient();

  const { startDate = defaultStartDate(), endDate = new Date().toISOString().slice(0, 10) } =
    params;

  const { data, error } = await supabase
    .from('analytics_daily_snapshots')
    .select('*')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: true });

  if (error) {
    console.error('[Analytics Trends Error]', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    date: row.snapshot_date,
    announcements: row.announcements_published,
    articles: row.articles_published,
    threads: row.forum_threads_created,
    replies: row.forum_replies_created,
    views: row.content_views,
    activeUsers: row.active_users,
  }));
}

// ---------------------------------------------------------------------------
// Combined response for the admin analytics endpoint
// ---------------------------------------------------------------------------

export async function getAnalyticsReport(
  params: AnalyticsQueryParams = {}
): Promise<AnalyticsResponse> {
  const [overview, trends] = await Promise.all([
    getAnalyticsOverview(),
    getAnalyticsTrends(params),
  ]);

  return { overview, trends };
}

// ---------------------------------------------------------------------------
// Record a content view
// ---------------------------------------------------------------------------

export async function recordContentView(
  contentType: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD',
  contentId: string,
  userId: string | null
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('content_views').insert({
    content_type: contentType,
    content_id: contentId,
    user_id: userId,
  });

  if (error) {
    console.error('[Record View Error]', error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
