import type {
  AnnouncementSearchFilters,
  AnnouncementSearchParams,
  AnnouncementSearchResult,
  SearchQueryState,
  SearchResultSet,
  SearchSortOption,
} from '@/modules/search/types';
import { SEARCH_DEFAULTS } from '@/modules/search/types';
import { createServerSupabaseClient } from '@/shared/lib/supabase-server';
import type { IContent } from '@/shared/types/database.types';

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
    page: 1,
    pageSize: results.length,
    totalPages: 1,
  };
}

// ---------------------------------------------------------------------------
// Database-backed full-text search
// ---------------------------------------------------------------------------

/**
 * Convert a user query string into a PostgreSQL tsquery-compatible string.
 * Splits on whitespace, strips non-alphanumeric chars, and joins with `&`.
 */
function toTsQueryInput(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .join(' & ');
}

function resolveSortOrder(sort: SearchSortOption): { column: string; ascending: boolean } {
  switch (sort) {
    case 'newest':
      return { column: 'published_at', ascending: false };
    case 'oldest':
      return { column: 'published_at', ascending: true };
    case 'relevance':
    default:
      return { column: 'published_at', ascending: false };
  }
}

export async function searchAnnouncements(
  params: AnnouncementSearchParams
): Promise<SearchResultSet> {
  const supabase = await createServerSupabaseClient();

  const page = params.page ?? 1;
  const pageSize = Math.min(
    params.pageSize ?? SEARCH_DEFAULTS.PAGE_SIZE,
    SEARCH_DEFAULTS.MAX_PAGE_SIZE
  );
  const sort = params.sort ?? SEARCH_DEFAULTS.SORT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const tsInput = params.query ? toTsQueryInput(params.query) : '';
  const hasFtsQuery = tsInput.length > 0;

  // Build the base query — always filter to published, non-deleted content.
  let query = supabase
    .from('content')
    .select(
      'id, title, body, slug, status, visibility, author_id, tags, created_at, updated_at, published_at, scheduled_at, deleted_at',
      { count: 'exact' }
    )
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null);

  // Full-text filter using the generated search_vector column.
  if (hasFtsQuery) {
    query = query.textSearch('search_vector', tsInput, { type: 'plain', config: 'english' });
  }

  // Optional filters
  if (params.status && params.status !== 'ALL') {
    query = query.eq('status', params.status);
  }

  if (params.visibility && params.visibility !== 'ALL') {
    query = query.eq('visibility', params.visibility);
  }

  if (params.tag) {
    query = query.contains('tags', [params.tag]);
  }

  if (params.organizationId) {
    // Filter content linked to the given organization via content_organizations.
    const { data: orgContentRows } = await supabase
      .from('content_organizations')
      .select('content_id')
      .eq('org_id', params.organizationId);

    const contentIds = (orgContentRows ?? []).map((row: { content_id: string }) => row.content_id);

    if (contentIds.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }

    query = query.in('id', contentIds);
  }

  // Sort
  const { column, ascending } = resolveSortOrder(sort);
  query = query.order(column, { ascending, nullsFirst: false });

  // Pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as IContent[];
  const normalizedQuery = params.query?.trim().toLowerCase() ?? '';

  const items: AnnouncementSearchResult[] = rows.map((content) => ({
    content,
    matchedFields: getMatchedFields(content, normalizedQuery),
  }));

  const total = count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
