import * as contentService from '@/modules/content/content.service';
import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase-server';
import type { IContent } from '@/shared/types/database.types';
import {
  asServerSupabaseClient,
  createQueryBuilder,
  createSupabaseClientMock,
} from '../../helpers/supabase';

jest.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
  createServiceRoleClient: jest.fn(),
}));

const mockedCreateServerSupabaseClient = jest.mocked(createServerSupabaseClient);
const mockedCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

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

  it('returns managed content scoped to the current author and requested filters', async () => {
    const supabase = createSupabaseClientMock();
    const managedBuilder = createQueryBuilder<IContent[]>({
      data: [baseContent],
      error: null,
    });

    supabase.from.mockReturnValueOnce(managedBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const result = await contentService.getManagedContent('user-1', false, {
      status: 'DRAFT',
      visibility: 'PUBLIC',
    });

    expect(managedBuilder.select).toHaveBeenCalledWith('*');
    expect(managedBuilder.is).toHaveBeenCalledWith('deleted_at', null);
    expect(managedBuilder.eq).toHaveBeenCalledWith('author_id', 'user-1');
    expect(managedBuilder.eq).toHaveBeenCalledWith('status', 'DRAFT');
    expect(managedBuilder.eq).toHaveBeenCalledWith('visibility', 'PUBLIC');
    expect(managedBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(result).toEqual([baseContent]);
  });

  it('returns null when a content lookup by id misses', async () => {
    const supabase = createSupabaseClientMock();
    const contentBuilder = createQueryBuilder<IContent | null>({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    supabase.from.mockReturnValueOnce(contentBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(contentService.getContentById('missing-content')).resolves.toBeNull();
    expect(contentBuilder.eq).toHaveBeenCalledWith('id', 'missing-content');
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

  it('returns whether a slug already exists', async () => {
    const supabase = createSupabaseClientMock();
    const slugBuilder = createQueryBuilder<null>({
      data: null,
      count: 1,
      error: null,
    });

    supabase.from.mockReturnValueOnce(slugBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    await expect(contentService.slugExists('semester-update')).resolves.toBe(true);
    expect(slugBuilder.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(slugBuilder.eq).toHaveBeenCalledWith('slug', 'semester-update');
  });

  it('creates published content, resolves slug collisions, links organizations, and writes an audit log', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:30:00.000Z'));

    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
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
      .mockReturnValueOnce(contentOrgBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const created = await contentService.createContent(
      'Semester Update',
      'The semester schedule has changed for all students.',
      'PUBLISHED',
      'PUBLIC',
      ['org-1', 'org-2'],
      'user-1',
      undefined,
      ['general']
    );

    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Semester Update',
        body: 'The semester schedule has changed for all students.',
        slug: expect.stringMatching(/^semester-update-[0-9a-f]{4}$/),
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        author_id: 'user-1',
        tags: ['general'],
        published_at: '2026-03-09T12:30:00.000Z',
      })
    );
    expect(contentOrgBuilder.insert).toHaveBeenCalledWith([
      { content_id: 'content-1', org_id: 'org-1' },
      { content_id: 'content-1', org_id: 'org-2' },
    ]);
    expect(auditBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        table_name: 'content',
        record_id: 'content-1',
        user_id: 'user-1',
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

  it('retries content creation without tags when the database is missing the tags column', async () => {
    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
    const slugAvailableBuilder = createQueryBuilder<null>({
      data: null,
      count: 0,
      error: null,
    });
    const insertWithTagsBuilder = createQueryBuilder<IContent | null>({
      data: null,
      error: { message: 'column content.tags does not exist' },
    });
    const fallbackInsertBuilder = createQueryBuilder<IContent>({
      data: baseContent,
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(slugAvailableBuilder)
      .mockReturnValueOnce(insertWithTagsBuilder)
      .mockReturnValueOnce(fallbackInsertBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const created = await contentService.createContent(
      'Semester Update',
      'The semester schedule has changed for all students.',
      'DRAFT',
      'PUBLIC',
      [],
      'user-1',
      undefined,
      ['general']
    );

    expect(insertWithTagsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['general'],
      })
    );
    const [fallbackInsertPayload] = fallbackInsertBuilder.insert.mock.calls[0];
    expect(fallbackInsertPayload).not.toHaveProperty('tags');
    expect(created).toEqual(baseContent);
  });

  it('sets published and updated timestamps when publishing existing content', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T14:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
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

    supabase.from.mockReturnValueOnce(beforeBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(updateBuilder).mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

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
        table_name: 'content',
        record_id: 'content-1',
        action: 'UPDATE',
        user_id: 'user-1',
      })
    );
    expect(updated.status).toBe('PUBLISHED');
  });

  it('preserves the original published timestamp when updating content that is already published', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T16:00:00.000Z'));

    const publishedContent = {
      ...baseContent,
      status: 'PUBLISHED' as const,
      published_at: '2026-03-09T12:00:00.000Z',
    };
    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
    const beforeBuilder = createQueryBuilder<IContent>({ data: publishedContent, error: null });
    const updateBuilder = createQueryBuilder<IContent>({
      data: {
        ...publishedContent,
        title: 'Updated Semester Update',
        updated_at: '2026-03-09T16:00:00.000Z',
      },
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from.mockReturnValueOnce(beforeBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(updateBuilder).mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const updated = await contentService.updateContent(
      'content-1',
      {
        title: 'Updated Semester Update',
        status: 'PUBLISHED',
      },
      'user-1'
    );

    const [updatePayload] = updateBuilder.update.mock.calls[0];
    expect(updatePayload).toEqual(
      expect.objectContaining({
        title: 'Updated Semester Update',
        status: 'PUBLISHED',
        updated_at: '2026-03-09T16:00:00.000Z',
      })
    );
    expect(updatePayload).not.toHaveProperty('published_at');
    expect(updated.published_at).toBe('2026-03-09T12:00:00.000Z');
  });

  it('retries updates without tags when the database is missing the tags column', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T16:30:00.000Z'));

    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
    const beforeBuilder = createQueryBuilder<IContent>({ data: baseContent, error: null });
    const updateWithTagsBuilder = createQueryBuilder<IContent | null>({
      data: null,
      error: { message: 'column content.tags does not exist' },
    });
    const fallbackUpdateBuilder = createQueryBuilder<IContent>({
      data: {
        ...baseContent,
        title: 'Updated Semester Update',
        updated_at: '2026-03-09T16:30:00.000Z',
      },
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from.mockReturnValueOnce(beforeBuilder);
    serviceRoleSupabase.from
      .mockReturnValueOnce(updateWithTagsBuilder)
      .mockReturnValueOnce(fallbackUpdateBuilder)
      .mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const updated = await contentService.updateContent(
      'content-1',
      {
        title: 'Updated Semester Update',
        tags: ['general'],
      },
      'user-1'
    );

    expect(updateWithTagsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Semester Update',
        tags: ['general'],
        updated_at: '2026-03-09T16:30:00.000Z',
      })
    );
    const [fallbackUpdatePayload] = fallbackUpdateBuilder.update.mock.calls[0];
    expect(fallbackUpdatePayload).not.toHaveProperty('tags');
    expect(updated.title).toBe('Updated Semester Update');
  });

  it('soft deletes content and does not fail the mutation if audit logging fails', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T15:00:00.000Z'));

    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
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

    supabase.from.mockReturnValueOnce(beforeBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(deleteBuilder).mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

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

  it('archives content through the shared update flow', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T17:00:00.000Z'));

    const publishedContent = {
      ...baseContent,
      status: 'PUBLISHED' as const,
      published_at: '2026-03-09T12:00:00.000Z',
    };
    const supabase = createSupabaseClientMock();
    const serviceRoleSupabase = createSupabaseClientMock();
    const beforeBuilder = createQueryBuilder<IContent>({ data: publishedContent, error: null });
    const updateBuilder = createQueryBuilder<IContent>({
      data: {
        ...publishedContent,
        status: 'ARCHIVED',
        updated_at: '2026-03-09T17:00:00.000Z',
      },
      error: null,
    });
    const auditBuilder = createQueryBuilder<null>({ data: null, error: null });

    supabase.from.mockReturnValueOnce(beforeBuilder);
    serviceRoleSupabase.from.mockReturnValueOnce(updateBuilder).mockReturnValueOnce(auditBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));
    mockedCreateServiceRoleClient.mockReturnValue(
      serviceRoleSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const archived = await contentService.archiveContent('content-1', 'user-1');

    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ARCHIVED',
        updated_at: '2026-03-09T17:00:00.000Z',
      })
    );
    expect(archived.status).toBe('ARCHIVED');
  });

  it('returns visible content using published filters and pagination', async () => {
    const supabase = createSupabaseClientMock();
    const visibilityBuilder = createQueryBuilder<IContent[]>({
      data: [baseContent],
      error: null,
    });

    supabase.from.mockReturnValueOnce(visibilityBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const result = await contentService.getContentByVisibility(
      'user-1',
      'STUDENT',
      'org-1',
      10,
      20
    );

    expect(visibilityBuilder.eq).toHaveBeenCalledWith('status', 'PUBLISHED');
    expect(visibilityBuilder.is).toHaveBeenCalledWith('deleted_at', null);
    expect(visibilityBuilder.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(visibilityBuilder.range).toHaveBeenCalledWith(20, 29);
    expect(result).toEqual([baseContent]);
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

  it('can include archived organization content when requested', async () => {
    const supabase = createSupabaseClientMock();
    const orgContentBuilder = createQueryBuilder<IContent[]>({
      data: [{ ...baseContent, status: 'ARCHIVED' }],
      error: null,
    });

    supabase.from.mockReturnValueOnce(orgContentBuilder);
    mockedCreateServerSupabaseClient.mockResolvedValue(asServerSupabaseClient(supabase));

    const result = await contentService.getContentByOrganization('org-1', true);

    expect(orgContentBuilder.eq).toHaveBeenCalledWith('content_organizations.org_id', 'org-1');
    expect(orgContentBuilder.neq).not.toHaveBeenCalled();
    expect(result).toEqual([{ ...baseContent, status: 'ARCHIVED' }]);
  });
});
