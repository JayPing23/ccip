import {
  buildAnnouncementSearchParams,
  buildAnnouncementSearchQueryState,
  filterAnnouncements,
} from '@/modules/search/search.service';
import type { IContent } from '@/shared/types/database.types';

const baseContent: IContent = {
  id: 'content-1',
  title: 'Campus Advisory',
  body: 'Classes are suspended due to weather.',
  slug: 'campus-advisory',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  author_id: 'user-1',
  tags: ['emergency'],
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T10:00:00.000Z',
  published_at: '2026-03-09T12:00:00.000Z',
  scheduled_at: null,
  deleted_at: null,
};

describe('search.service – pure functions', () => {
  describe('buildAnnouncementSearchParams', () => {
    it('builds URLSearchParams from filters', () => {
      const params = buildAnnouncementSearchParams({
        query: 'campus',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        tag: 'emergency',
        organizationId: 'org-1',
      });

      expect(params.get('q')).toBe('campus');
      expect(params.get('status')).toBe('PUBLISHED');
      expect(params.get('visibility')).toBe('PUBLIC');
      expect(params.get('tag')).toBe('emergency');
      expect(params.get('org')).toBe('org-1');
    });

    it('omits ALL status and visibility', () => {
      const params = buildAnnouncementSearchParams({ status: 'ALL', visibility: 'ALL' });

      expect(params.has('status')).toBe(false);
      expect(params.has('visibility')).toBe(false);
    });

    it('omits empty query', () => {
      const params = buildAnnouncementSearchParams({});
      expect(params.has('q')).toBe(false);
    });
  });

  describe('buildAnnouncementSearchQueryState', () => {
    it('parses URLSearchParams into state', () => {
      const params = new URLSearchParams(
        'q=campus&status=PUBLISHED&visibility=PUBLIC&tag=emergency&org=org-1'
      );

      const state = buildAnnouncementSearchQueryState(params);

      expect(state.q).toBe('campus');
      expect(state.status).toBe('PUBLISHED');
      expect(state.visibility).toBe('PUBLIC');
      expect(state.tag).toBe('emergency');
      expect(state.org).toBe('org-1');
    });

    it('returns undefined for missing params', () => {
      const state = buildAnnouncementSearchQueryState(new URLSearchParams());

      expect(state.q).toBeUndefined();
      expect(state.status).toBeUndefined();
      expect(state.visibility).toBeUndefined();
      expect(state.tag).toBeUndefined();
      expect(state.org).toBeUndefined();
    });
  });

  describe('filterAnnouncements', () => {
    const items: IContent[] = [
      baseContent,
      {
        ...baseContent,
        id: 'content-2',
        title: 'Library Hours',
        body: 'Library opens at 8 AM.',
        slug: 'library-hours',
        tags: ['general'],
        visibility: 'ORG_ONLY',
      },
    ];

    it('returns all items when no filters', () => {
      const result = filterAnnouncements(items, {});
      expect(result.total).toBe(2);
    });

    it('filters by query matching title', () => {
      const result = filterAnnouncements(items, { query: 'campus' });
      expect(result.total).toBe(1);
      expect(result.items[0].content.id).toBe('content-1');
    });

    it('filters by tag', () => {
      const result = filterAnnouncements(items, { tag: 'general' });
      expect(result.total).toBe(1);
      expect(result.items[0].content.id).toBe('content-2');
    });

    it('filters by visibility', () => {
      const result = filterAnnouncements(items, { visibility: 'ORG_ONLY' });
      expect(result.total).toBe(1);
      expect(result.items[0].content.id).toBe('content-2');
    });

    it('ALL visibility returns all items', () => {
      const result = filterAnnouncements(items, { visibility: 'ALL' });
      expect(result.total).toBe(2);
    });

    it('returns empty when no match', () => {
      const result = filterAnnouncements(items, { query: 'nonexistent' });
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('populates matchedFields for title match', () => {
      const result = filterAnnouncements(items, { query: 'advisory' });
      expect(result.items[0].matchedFields).toContain('title');
    });

    it('populates matchedFields for body match', () => {
      const result = filterAnnouncements(items, { query: 'suspended' });
      expect(result.items[0].matchedFields).toContain('body');
    });

    it('populates matchedFields for tag match', () => {
      const result = filterAnnouncements(items, { query: 'emergency' });
      expect(result.items[0].matchedFields).toContain('tags');
    });
  });
});
