import type { IContent } from '@/shared/types/database.types';
import type {
  AnnouncementSearchFilters,
  AnnouncementSearchResult,
  SearchQueryState,
  SearchResultSet,
} from '@/modules/search/types';

function normalizeSearchQuery(query?: string): string {
  return query?.trim().toLowerCase() ?? '';
}

function getMatchedFields(
  content: IContent,
  normalizedQuery: string
): AnnouncementSearchResult['matchedFields'] {
  if (!normalizedQuery) {
    return [];
  }

  const matchedFields: AnnouncementSearchResult['matchedFields'] = [];

  if (content.title.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('title');
  }

  if (content.body.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('body');
  }

  if (content.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
    matchedFields.push('tags');
  }

  return matchedFields;
}

export function buildAnnouncementSearchParams(filters: AnnouncementSearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('q', filters.query);
  }

  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status);
  }

  if (filters.visibility && filters.visibility !== 'ALL') {
    params.set('visibility', filters.visibility);
  }

  if (filters.tag) {
    params.set('tag', filters.tag);
  }

  if (filters.organizationId) {
    params.set('org', filters.organizationId);
  }

  return params;
}

export function buildAnnouncementSearchQueryState(params: URLSearchParams): SearchQueryState {
  return {
    q: params.get('q') || undefined,
    status: (params.get('status') as SearchQueryState['status']) || undefined,
    visibility: (params.get('visibility') as SearchQueryState['visibility']) || undefined,
    tag: (params.get('tag') as SearchQueryState['tag']) || undefined,
    org: params.get('org') || undefined,
  };
}

export function filterAnnouncements(
  items: IContent[],
  filters: AnnouncementSearchFilters
): SearchResultSet {
  const normalizedQuery = normalizeSearchQuery(filters.query);

  const results = items.reduce<AnnouncementSearchResult[]>((matches, content) => {
    const matchedFields = getMatchedFields(content, normalizedQuery);
    const matchesQuery = !normalizedQuery || matchedFields.length > 0;
    const matchesStatus =
      !filters.status || filters.status === 'ALL' || content.status === filters.status;
    const matchesVisibility =
      !filters.visibility ||
      filters.visibility === 'ALL' ||
      content.visibility === filters.visibility;
    const matchesTag = !filters.tag || content.tags?.includes(filters.tag);

    if (matchesQuery && matchesStatus && matchesVisibility && matchesTag) {
      matches.push({ content, matchedFields });
    }

    return matches;
  }, []);

  return {
    total: results.length,
    items: results,
  };
}
