import { createServiceRoleClient } from '@/shared/lib/supabase-server';
import * as retention from '@/shared/utils/retention';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockedCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

describe('retention utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getRetentionPolicies
  // -----------------------------------------------------------------------

  describe('getRetentionPolicies', () => {
    it('returns enabled policies ordered by content_type', async () => {
      const supabase = createSupabaseClientMock();
      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];
      const builder = createQueryBuilder({ data: policies, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionPolicies();

      expect(supabase.from).toHaveBeenCalledWith('retention_policies');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('enabled', true);
      expect(builder.order).toHaveBeenCalledWith('content_type');
      expect(result).toEqual(policies);
    });

    it('returns empty array on error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: null, error: { message: 'Query failed' } });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionPolicies();

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null and no error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: null, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionPolicies();

      expect(result).toEqual([]);
    });

    it('returns multiple policies', async () => {
      const supabase = createSupabaseClientMock();
      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'p2',
          content_type: 'ARTICLE',
          stale_after_days: 365,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'p3',
          content_type: 'THREAD',
          stale_after_days: 180,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];
      const builder = createQueryBuilder({ data: policies, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionPolicies();

      expect(result).toHaveLength(3);
      expect(result[0].content_type).toBe('ANNOUNCEMENT');
      expect(result[1].content_type).toBe('ARTICLE');
      expect(result[2].content_type).toBe('THREAD');
    });
  });

  // -----------------------------------------------------------------------
  // updateRetentionPolicy
  // -----------------------------------------------------------------------

  describe('updateRetentionPolicy', () => {
    it('updates a policy and returns the result', async () => {
      const supabase = createSupabaseClientMock();
      const updated = {
        id: 'p1',
        content_type: 'ANNOUNCEMENT',
        stale_after_days: 120,
        auto_archive_after_days: 180,
        enabled: true,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-10T00:00:00Z',
      };
      const builder = createQueryBuilder({ data: updated, error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.updateRetentionPolicy('p1', { stale_after_days: 120 });

      expect(supabase.from).toHaveBeenCalledWith('retention_policies');
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ stale_after_days: 120 })
      );
      expect(builder.eq).toHaveBeenCalledWith('id', 'p1');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('returns null on update error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: null, error: { message: 'Update failed' } });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.updateRetentionPolicy('p1', { stale_after_days: 120 });

      expect(result).toBeNull();
    });

    it('includes updated_at timestamp in the update payload', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: false,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-10T00:00:00Z',
        },
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.updateRetentionPolicy('p1', { enabled: false });

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
          updated_at: expect.any(String),
        })
      );
    });

    it('can update auto_archive_after_days to null', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-10T00:00:00Z',
        },
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.updateRetentionPolicy('p1', {
        auto_archive_after_days: null,
      });

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ auto_archive_after_days: null })
      );
      expect(result?.auto_archive_after_days).toBeNull();
    });

    it('can update multiple fields at once', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: {
          id: 'p1',
          content_type: 'ARTICLE',
          stale_after_days: 200,
          auto_archive_after_days: 400,
          enabled: false,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-10T00:00:00Z',
        },
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.updateRetentionPolicy('p1', {
        stale_after_days: 200,
        auto_archive_after_days: 400,
        enabled: false,
      });

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          stale_after_days: 200,
          auto_archive_after_days: 400,
          enabled: false,
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // archiveStaleContent
  // -----------------------------------------------------------------------

  describe('archiveStaleContent', () => {
    it('archives content for announcements (table=content, status=ARCHIVED)', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: [{ id: 'c1' }, { id: 'c2' }],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const count = await retention.archiveStaleContent('ANNOUNCEMENT', ['c1', 'c2']);

      expect(supabase.from).toHaveBeenCalledWith('content');
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }));
      expect(builder.in).toHaveBeenCalledWith('id', ['c1', 'c2']);
      expect(count).toBe(2);
    });

    it('archives articles (table=articles, status=ARCHIVED)', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: [{ id: 'a1' }],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const count = await retention.archiveStaleContent('ARTICLE', ['a1']);

      expect(supabase.from).toHaveBeenCalledWith('articles');
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }));
      expect(count).toBe(1);
    });

    it('archives threads (table=forum_threads, status=LOCKED)', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const count = await retention.archiveStaleContent('THREAD', ['t1', 't2', 't3']);

      expect(supabase.from).toHaveBeenCalledWith('forum_threads');
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'LOCKED' }));
      expect(count).toBe(3);
    });

    it('returns 0 for empty ids', async () => {
      const count = await retention.archiveStaleContent('ANNOUNCEMENT', []);
      expect(count).toBe(0);
    });

    it('returns 0 on archive error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: null,
        error: { message: 'Archive failed' },
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const count = await retention.archiveStaleContent('ARTICLE', ['c1']);

      expect(count).toBe(0);
    });

    it('includes updated_at in the update payload', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: [{ id: 'c1' }],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.archiveStaleContent('ANNOUNCEMENT', ['c1']);

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ARCHIVED',
          updated_at: expect.any(String),
        })
      );
    });

    it('selects id after update', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: [{ id: 'c1' }],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.archiveStaleContent('ANNOUNCEMENT', ['c1']);

      expect(builder.select).toHaveBeenCalledWith('id');
    });

    it('returns 0 when data is null and no error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({
        data: null,
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const count = await retention.archiveStaleContent('ANNOUNCEMENT', ['c1']);

      expect(count).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getRetentionCandidates
  // -----------------------------------------------------------------------

  describe('getRetentionCandidates', () => {
    it('returns candidates aggregated from all enabled policies', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const staleItems = [
        {
          id: 'c1',
          title: 'Old Announcement',
          status: 'PUBLISHED',
          updated_at: '2025-06-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: staleItems, error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].content_type).toBe('ANNOUNCEMENT');
      expect(result.candidates[0].title).toBe('Old Announcement');
      expect(result.candidates[0].age_days).toBeGreaterThan(0);
    });

    it('returns empty summary when no policies exist', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.totalStale).toBe(0);
      expect(result.totalArchivable).toBe(0);
      expect(result.candidates).toHaveLength(0);
    });

    it('returns empty candidates when queries return no stale items', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const emptyBuilder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return emptyBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.totalStale).toBe(0);
      expect(result.totalArchivable).toBe(0);
      expect(result.candidates).toHaveLength(0);
    });

    it('correctly categorizes FLAG_STALE vs ARCHIVE based on auto_archive_after_days', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      // One item old enough to archive, one only stale
      const now = new Date();
      const staleDate = new Date(now);
      staleDate.setDate(staleDate.getDate() - 100); // 100 days ago → stale but not archivable

      const archiveDate = new Date(now);
      archiveDate.setDate(archiveDate.getDate() - 200); // 200 days ago → archivable

      const staleItems = [
        {
          id: 'c1',
          title: 'Archivable',
          status: 'PUBLISHED',
          updated_at: archiveDate.toISOString(),
        },
        {
          id: 'c2',
          title: 'Just Stale',
          status: 'PUBLISHED',
          updated_at: staleDate.toISOString(),
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: staleItems, error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.candidates).toHaveLength(2);

      const archivable = result.candidates.find((c) => c.id === 'c1');
      const stale = result.candidates.find((c) => c.id === 'c2');

      expect(archivable?.recommended_action).toBe('ARCHIVE');
      expect(stale?.recommended_action).toBe('FLAG_STALE');

      expect(result.totalArchivable).toBe(1);
      expect(result.totalStale).toBe(1);
    });

    it('marks all candidates as FLAG_STALE when auto_archive_after_days is null', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p2',
          content_type: 'ARTICLE',
          stale_after_days: 365,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const staleItems = [
        {
          id: 'a1',
          title: 'Very Old Article',
          status: 'PUBLISHED',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: staleItems, error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].recommended_action).toBe('FLAG_STALE');
      expect(result.totalStale).toBe(1);
      expect(result.totalArchivable).toBe(0);
    });

    it('handles query errors gracefully by returning empty candidates for that type', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const errorBuilder = createQueryBuilder({
        data: null,
        error: { message: 'Query failed' },
      });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return errorBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.candidates).toHaveLength(0);
      expect(result.totalStale).toBe(0);
      expect(result.totalArchivable).toBe(0);
    });

    it('queries correct tables for each content type', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: 180,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'p2',
          content_type: 'ARTICLE',
          stale_after_days: 365,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'p3',
          content_type: 'THREAD',
          stale_after_days: 180,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const emptyBuilder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return emptyBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.getRetentionCandidates();

      const fromCalls = supabase.from.mock.calls.map((c: string[]) => c[0]);
      expect(fromCalls).toContain('retention_policies');
      expect(fromCalls).toContain('content');
      expect(fromCalls).toContain('articles');
      expect(fromCalls).toContain('forum_threads');
    });

    it('applies correct active statuses filter per content type', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.getRetentionCandidates();

      // Verify announcements query uses correct active statuses
      expect(contentBuilder.in).toHaveBeenCalledWith('status', ['PUBLISHED', 'SCHEDULED']);
      expect(contentBuilder.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('calculates age_days correctly', async () => {
      const supabase = createSupabaseClientMock();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-10T00:00:00Z'));

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const staleItems = [
        {
          id: 'c1',
          title: 'Exact 100 Days',
          status: 'PUBLISHED',
          updated_at: '2025-12-01T00:00:00Z', // exactly 99 days before 2026-03-10
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: staleItems, error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await retention.getRetentionCandidates();

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].age_days).toBeGreaterThan(0);
      expect(typeof result.candidates[0].age_days).toBe('number');

      jest.useRealTimers();
    });

    it('limits query to 100 results per content type', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.getRetentionCandidates();

      expect(contentBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('orders candidates by updated_at ascending', async () => {
      const supabase = createSupabaseClientMock();

      const policies = [
        {
          id: 'p1',
          content_type: 'ANNOUNCEMENT',
          stale_after_days: 90,
          auto_archive_after_days: null,
          enabled: true,
          created_at: '2026-03-01T00:00:00Z',
          updated_at: '2026-03-01T00:00:00Z',
        },
      ];

      const policyBuilder = createQueryBuilder({ data: policies, error: null });
      const contentBuilder = createQueryBuilder({ data: [], error: null });

      supabase.from.mockImplementation((table: string) => {
        if (table === 'retention_policies') return policyBuilder;
        return contentBuilder;
      });

      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      await retention.getRetentionCandidates();

      expect(contentBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: true });
    });
  });

  // -----------------------------------------------------------------------
  // RETENTION_DEFAULTS
  // -----------------------------------------------------------------------

  describe('RETENTION_DEFAULTS', () => {
    it('has defaults for all content types', () => {
      expect(retention.RETENTION_DEFAULTS.ANNOUNCEMENT).toEqual({
        staleDays: 90,
        archiveDays: 180,
      });
      expect(retention.RETENTION_DEFAULTS.ARTICLE).toEqual({
        staleDays: 365,
        archiveDays: null,
      });
      expect(retention.RETENTION_DEFAULTS.THREAD).toEqual({
        staleDays: 180,
        archiveDays: null,
      });
    });

    it('has exactly three content type defaults', () => {
      const keys = Object.keys(retention.RETENTION_DEFAULTS);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('ANNOUNCEMENT');
      expect(keys).toContain('ARTICLE');
      expect(keys).toContain('THREAD');
    });

    it('staleDays values are positive integers', () => {
      for (const key of Object.keys(
        retention.RETENTION_DEFAULTS
      ) as retention.RetentionContentType[]) {
        expect(retention.RETENTION_DEFAULTS[key].staleDays).toBeGreaterThan(0);
        expect(Number.isInteger(retention.RETENTION_DEFAULTS[key].staleDays)).toBe(true);
      }
    });

    it('archiveDays values are either null or positive integers', () => {
      for (const key of Object.keys(
        retention.RETENTION_DEFAULTS
      ) as retention.RetentionContentType[]) {
        const val = retention.RETENTION_DEFAULTS[key].archiveDays;
        expect(val === null || (typeof val === 'number' && val > 0 && Number.isInteger(val))).toBe(
          true
        );
      }
    });
  });
});
