import type { ContentTag } from '@/shared/constants/tags';
import type { IContent } from '@/shared/types/database.types';
import type { IArticle } from '@/modules/publication/types';
import type { IForumThread } from '@/modules/forum/types';

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

// ---------------------------------------------------------------------------
// Article (publication) search types
// ---------------------------------------------------------------------------

export type ArticleSearchSortOption = 'relevance' | 'newest' | 'oldest';

export interface ArticleSearchResult {
  article: IArticle;
  matchedFields: Array<'title' | 'body' | 'excerpt'>;
}

export interface ArticleSearchResultSet {
  total: number;
  items: ArticleSearchResult[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ArticleSearchParams {
  query?: string;
  section?: string;
  page?: number;
  pageSize?: number;
  sort?: ArticleSearchSortOption;
}

// ---------------------------------------------------------------------------
// Forum thread search types
// ---------------------------------------------------------------------------

export type ForumThreadSearchSortOption = 'relevance' | 'newest' | 'oldest';

export interface ForumThreadSearchResult {
  thread: IForumThread;
  matchedFields: Array<'title' | 'body'>;
}

export interface ForumThreadSearchResultSet {
  total: number;
  items: ForumThreadSearchResult[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ForumThreadSearchParams {
  query?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sort?: ForumThreadSearchSortOption;
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
