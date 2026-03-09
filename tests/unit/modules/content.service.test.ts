import * as contentService from '@/modules/content/content.service';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IContent } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);

const baseContent: IContent = {
  id: 'content-1',
  title: 'Semester Update',
  body: 'The semester schedule has changed for all students.',
  slug: 'semester-update',
  status: 'DRAFT',
  visibility: 'PUBLIC',
  author_id: 'user-1',
  tags: ['general'],
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  published_at: null,
  scheduled_at: null,
  deleted_at: null,
};

describe('content.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('returns published content ordered by publish date', async () => {
    const supabase = createSupabaseClientMock();
    const publishedBuilder = createQueryBuilder<IContent[]>({
      data: [{ ...baseContent, status: 'PUBLISHED', published_at: '2026-03-09T12:00:00.000Z' }],
      error: null,
    });

    supabase.from.mockReturnValueOnce(publishedBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const result = await contentService.getPublishedContent();

    expect(supabase.from).toHaveBeenCalledWith('content');
    expect(publishedBuilder.select).toHaveBeenCalledWith('*');
    expect(publishedBuilder.eq).toHaveBeenCalledWith('status', 'PUBLISHED');
    expect(publishedBuilder.is).toHaveBeenCalledWith('deleted_at', null);
    expect(publishedBuilder.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(result).toEqual([
      { ...baseContent, status: 'PUBLISHED', published_at: '2026-03-09T12:00:00.000Z' },
    ]);
  });

  it('returns null when a slug lookup misses', async () => {
    const supabase = createSupabaseClientMock();
    const slugBuilder = createQueryBuilder<IContent | null>({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    supabase.from.mockReturnValueOnce(slugBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(contentService.getContentBySlug('missing-slug')).resolves.toBeNull();
  });

  it('creates published content, resolves slug collisions, links organizations, and writes an audit log', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:30:00.000Z'));

    const supabase = createSupabaseClientMock();
    const slugExistsBuilder = createQueryBuilder<null>({
      data: null,
      count: 1,
      error: null,
    });
    const slugAvailableBuilder = createQueryBuilder<null>({
      data: null,
      count: 0,
      error: null,
    });
    const insertBuilder = createQueryBuilder<IContent>({
      data: {
        ...baseContent,
        slug: 'semester-update-abcd',
        status: 'PUBLISHED',
        published_at: '2026-03-09T12:30:00.000Z',
      },
      error: null,
    });
    const contentOrgBuilder = createQueryBuilder<null>({ data: null, error: null });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(slugExistsBuilder)
      .mockReturnValueOnce(slugAvailableBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(contentOrgBuilder)
      .mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const created = await contentService.createContent(
      'Semester Update',
      'The semester schedule has changed for all students.',
      'PUBLISHED',
      'PUBLIC',
      ['org-1', 'org-2'],
      'user-1'
    );

    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Semester Update',
        body: 'The semester schedule has changed for all students.',
        slug: expect.stringMatching(/^semester-update-[0-9a-f]{4}$/),
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        author_id: 'user-1',
        published_at: '2026-03-09T12:30:00.000Z',
      })
    );
    expect(contentOrgBuilder.insert).toHaveBeenCalledWith([
      { content_id: 'content-1', org_id: 'org-1' },
      { content_id: 'content-1', org_id: 'org-2' },
    ]);
    expect(auditBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content_id: 'content-1',
        actor_id: 'user-1',
        action: 'INSERT',
      })
    );
    expect(created).toEqual({
      ...baseContent,
      slug: 'semester-update-abcd',
      status: 'PUBLISHED',
      published_at: '2026-03-09T12:30:00.000Z',
    });
  });

  it('sets published and updated timestamps when publishing existing content', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T14:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const beforeBuilder = createQueryBuilder<IContent>({ data: baseContent, error: null });
    const updateBuilder = createQueryBuilder<IContent>({
      data: {
        ...baseContent,
        status: 'PUBLISHED',
        updated_at: '2026-03-09T14:00:00.000Z',
        published_at: '2026-03-09T14:00:00.000Z',
      },
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(beforeBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const updated = await contentService.publishContent('content-1', 'user-1');

    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PUBLISHED',
        updated_at: '2026-03-09T14:00:00.000Z',
        published_at: '2026-03-09T14:00:00.000Z',
      })
    );
    expect(auditBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        actor_id: 'user-1',
      })
    );
    expect(updated.status).toBe('PUBLISHED');
  });

  it('soft deletes content and does not fail the mutation if audit logging fails', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T15:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const beforeBuilder = createQueryBuilder<IContent>({ data: baseContent, error: null });
    const deleteBuilder = createQueryBuilder<IContent>({
      data: {
        ...baseContent,
        deleted_at: '2026-03-09T15:00:00.000Z',
        updated_at: '2026-03-09T15:00:00.000Z',
      },
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({
      data: null,
      error: { message: 'audit insert failed' },
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    supabase.from
      .mockReturnValueOnce(beforeBuilder)
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const deleted = await contentService.deleteContent('content-1', 'user-1');

    expect(deleteBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: '2026-03-09T15:00:00.000Z',
        updated_at: '2026-03-09T15:00:00.000Z',
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log audit event:', {
      message: 'audit insert failed',
    });
    expect(deleted.deleted_at).toBe('2026-03-09T15:00:00.000Z');
  });

  it('filters organization content to exclude archived entries by default', async () => {
    const supabase = createSupabaseClientMock();
    const orgContentBuilder = createQueryBuilder<IContent[]>({
      data: [baseContent],
      error: null,
    });

    supabase.from.mockReturnValueOnce(orgContentBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const result = await contentService.getContentByOrganization('org-1');

    expect(orgContentBuilder.select).toHaveBeenCalledWith('*, content_organizations!inner(org_id)');
    expect(orgContentBuilder.eq).toHaveBeenCalledWith('content_organizations.org_id', 'org-1');
    expect(orgContentBuilder.neq).toHaveBeenCalledWith('status', 'ARCHIVED');
    expect(result).toEqual([baseContent]);
  });
});
