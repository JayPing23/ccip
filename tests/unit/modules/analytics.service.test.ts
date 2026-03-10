import * as analyticsService from '@/modules/admin/analytics.service';
import { createServiceRoleClient } from '@/shared/lib/supabase-server';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockedCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

describe('analytics.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalyticsOverview', () => {
    it('returns aggregate counts across all modules', async () => {
      const supabase = createSupabaseClientMock();

      // Mock the six parallel queries + one follow-up active users query
      const usersBuilder = createQueryBuilder({ data: null, error: null, count: 100 });
      const contentBuilder = createQueryBuilder({ data: null, error: null, count: 25 });
      const articlesBuilder = createQueryBuilder({ data: null, error: null, count: 15 });
      const threadsBuilder = createQueryBuilder({ data: null, error: null, count: 50 });
      const repliesBuilder = createQueryBuilder({ data: null, error: null, count: 200 });
      const viewsBuilder = createQueryBuilder({ data: null, error: null, count: 1000 });
      const activeUsersBuilder = createQueryBuilder({
        data: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u1' }],
        error: null,
      });

      supabase.from
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(contentBuilder)
        .mockReturnValueOnce(articlesBuilder)
        .mockReturnValueOnce(threadsBuilder)
        .mockReturnValueOnce(repliesBuilder)
        .mockReturnValueOnce(viewsBuilder)
        .mockReturnValueOnce(activeUsersBuilder);

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await analyticsService.getAnalyticsOverview();

      expect(result.totalUsers).toBe(100);
      expect(result.totalAnnouncements).toBe(25);
      expect(result.totalArticles).toBe(15);
      expect(result.totalThreads).toBe(50);
      expect(result.totalReplies).toBe(200);
      expect(result.totalViews).toBe(1000);
      expect(result.activeUsers).toBe(2); // 2 unique users
    });
  });

  describe('getAnalyticsTrends', () => {
    it('returns time-series data from snapshots', async () => {
      const supabase = createSupabaseClientMock();
      const snapshotData = [
        {
          snapshot_date: '2026-03-01',
          announcements_published: 5,
          articles_published: 3,
          forum_threads_created: 10,
          forum_replies_created: 40,
          content_views: 200,
          active_users: 50,
        },
      ];
      const builder = createQueryBuilder({ data: snapshotData, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await analyticsService.getAnalyticsTrends({
        startDate: '2026-03-01',
        endDate: '2026-03-10',
      });

      expect(supabase.from).toHaveBeenCalledWith('analytics_daily_snapshots');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2026-03-01',
        announcements: 5,
        articles: 3,
        threads: 10,
        replies: 40,
        views: 200,
        activeUsers: 50,
      });
    });

    it('returns empty array on error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: null, error: { message: 'Failed' } });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await analyticsService.getAnalyticsTrends();

      expect(result).toEqual([]);
    });
  });

  describe('recordContentView', () => {
    it('inserts a content view record', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: null, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await analyticsService.recordContentView('ANNOUNCEMENT', 'content-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('content_views');
      expect(builder.insert).toHaveBeenCalledWith({
        content_type: 'ANNOUNCEMENT',
        content_id: 'content-1',
        user_id: 'user-1',
      });
    });
  });
});
