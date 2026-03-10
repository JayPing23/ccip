import type { ContentTag } from '@/shared/constants/tags';
import type { IContent } from '@/shared/types/database.types';

export type AnnouncementStatusFilter = IContent['status'] | 'ALL';
export type AnnouncementVisibilityFilter = IContent['visibility'] | 'ALL';

export interface AnnouncementSearchFilters {
  query?: string;
  status?: AnnouncementStatusFilter;
  visibility?: AnnouncementVisibilityFilter;
  tag?: ContentTag | null;
  organizationId?: string | null;
}

export interface SearchQueryState {
  q?: string;
  status?: AnnouncementStatusFilter;
  visibility?: AnnouncementVisibilityFilter;
  tag?: ContentTag;
  org?: string;
}

export interface AnnouncementSearchResult {
  content: IContent;
  matchedFields: Array<'title' | 'body' | 'tags'>;
}

export type SearchSortOption = 'relevance' | 'newest' | 'oldest';

export interface SearchResultSet {
  total: number;
  items: AnnouncementSearchResult[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AnnouncementSearchParams extends AnnouncementSearchFilters {
  page?: number;
  pageSize?: number;
  sort?: SearchSortOption;
}

export const SEARCH_SORT_OPTIONS: readonly SearchSortOption[] = [
  'relevance',
  'newest',
  'oldest',
] as const;

export const SEARCH_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT: 'relevance' as SearchSortOption,
} as const;
