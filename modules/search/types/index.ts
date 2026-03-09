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

export interface SearchResultSet {
  total: number;
  items: AnnouncementSearchResult[];
}
