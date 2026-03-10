import * as externalPublishService from '@/modules/external_publish/external_publish.service';
import type { IExternalPublishTarget } from '@/modules/external_publish/types';
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

const baseTarget: IExternalPublishTarget = {
  id: 'target-1',
  content_id: 'content-1',
  content_type: 'ANNOUNCEMENT',
  platform: 'facebook',
  external_post_id: null,
  status: 'PENDING',
  error_log: null,
  retry_count: 0,
  max_retries: 3,
  next_retry_at: null,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
};

describe('external_publish.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExternalPublishTargets', () => {
    it('inserts targets for specified platforms', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder<IExternalPublishTarget[]>({
        data: [baseTarget],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await externalPublishService.createExternalPublishTargets(
        'content-1',
        'ANNOUNCEMENT',
        ['facebook']
      );

      expect(supabase.from).toHaveBeenCalledWith('content_external_targets');
      expect(builder.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          content_id: 'content-1',
          content_type: 'ANNOUNCEMENT',
          platform: 'facebook',
          status: 'PENDING',
        }),
      ]);
      expect(result).toEqual([baseTarget]);
    });

    it('returns empty array on insert error', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder<IExternalPublishTarget[]>({
        data: [],
        error: { message: 'Insert failed' },
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await externalPublishService.createExternalPublishTargets(
        'content-1',
        'ANNOUNCEMENT',
        ['facebook']
      );

      expect(result).toEqual([]);
    });
  });

  describe('getExternalPublishTargets', () => {
    it('returns targets for a content item', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder<IExternalPublishTarget[]>({
        data: [baseTarget],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await externalPublishService.getExternalPublishTargets('content-1');

      expect(supabase.from).toHaveBeenCalledWith('content_external_targets');
      expect(builder.eq).toHaveBeenCalledWith('content_id', 'content-1');
      expect(result).toEqual([baseTarget]);
    });
  });

  describe('getExternalPublishSummary', () => {
    it('returns summary with counts', async () => {
      const supabase = createSupabaseClientMock();
      const postedTarget = { ...baseTarget, id: 'target-2', status: 'POSTED' as const };
      const builder = createQueryBuilder<IExternalPublishTarget[]>({
        data: [baseTarget, postedTarget],
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await externalPublishService.getExternalPublishSummary();

      expect(result.total).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.posted).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('markTargetPosted', () => {
    it('updates target status to POSTED', async () => {
      const supabase = createSupabaseClientMock();
      const updatedTarget = {
        ...baseTarget,
        status: 'POSTED' as const,
        external_post_id: 'fb-123',
      };
      const builder = createQueryBuilder<IExternalPublishTarget>({
        data: updatedTarget,
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const result = await externalPublishService.markTargetPosted('target-1', 'fb-123');

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'POSTED',
          external_post_id: 'fb-123',
        })
      );
      expect(result).toEqual(updatedTarget);
    });
  });

  describe('processExternalPublishTarget', () => {
    it('rejects ineligible content types', async () => {
      const supabase = createSupabaseClientMock();
      const builder = createQueryBuilder<IExternalPublishTarget>({
        data: baseTarget,
        error: null,
      });

      supabase.from.mockReturnValue(builder);
      mockedCreateServiceRoleClient.mockReturnValue(
        asServerSupabaseClient(supabase) as ReturnType<typeof createServiceRoleClient>
      );

      const threadTarget = { ...baseTarget, content_type: 'THREAD' as never };
      const result = await externalPublishService.processExternalPublishTarget(threadTarget);

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Ineligible content type');
    });

    it('returns pending status for valid content', async () => {
      const result = await externalPublishService.processExternalPublishTarget(baseTarget);

      expect(result.status).toBe('PENDING');
      expect(result.platform).toBe('facebook');
    });
  });
});
