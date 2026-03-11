'use client';

import type {
  AnnouncementStatusFilter,
  AnnouncementVisibilityFilter,
  SearchSortOption,
} from '@/modules/search/types';
import { SEARCH_SORT_OPTIONS } from '@/modules/search/types';
import type { ContentTag } from '@/shared/constants/tags';
import { CONTENT_TAGS } from '@/shared/constants/tags';
import { useCallback, useState } from 'react';

interface SearchFiltersProps {
  filters: {
    query?: string;
    status?: AnnouncementStatusFilter;
    visibility?: AnnouncementVisibilityFilter;
    tag?: ContentTag | null;
    sort?: SearchSortOption;
  };
  onQueryChange: (q: string) => void;
  onStatusChange: (status: AnnouncementStatusFilter) => void;
  onVisibilityChange: (visibility: AnnouncementVisibilityFilter) => void;
  onTagChange: (tag: ContentTag | null) => void;
  onSortChange: (sort: SearchSortOption) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: AnnouncementStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const VISIBILITY_OPTIONS: { value: AnnouncementVisibilityFilter; label: string }[] = [
  { value: 'ALL', label: 'All visibility' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'ORG_ONLY', label: 'Organization only' },
  { value: 'DEPT_ONLY', label: 'Department only' },
];

const SORT_LABELS: Record<SearchSortOption, string> = {
  relevance: 'Relevance',
  newest: 'Newest first',
  oldest: 'Oldest first',
};

function hasActiveFilters(filters: SearchFiltersProps['filters']): boolean {
  return !!(
    filters.query ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.visibility && filters.visibility !== 'ALL') ||
    filters.tag
  );
}

export default function SearchFilters({
  filters,
  onQueryChange,
  onStatusChange,
  onVisibilityChange,
  onTagChange,
  onSortChange,
  onReset,
}: SearchFiltersProps) {
  const [localQuery, setLocalQuery] = useState(filters.query ?? '');

  const handleQueryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onQueryChange(localQuery);
      }
    },
    [localQuery, onQueryChange]
  );

  const handleQueryBlur = useCallback(() => {
    if (localQuery !== (filters.query ?? '')) {
      onQueryChange(localQuery);
    }
  }, [localQuery, filters.query, onQueryChange]);

  const handleClearQuery = useCallback(() => {
    setLocalQuery('');
    onQueryChange('');
  }, [onQueryChange]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search announcements…"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            onQueryChange(e.target.value);
          }}
          onKeyDown={handleQueryKeyDown}
          onBlur={handleQueryBlur}
          className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 w-full rounded-lg border py-2 pr-10 pl-4 text-sm focus:ring-1"
          aria-label="Search announcements"
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClearQuery}
            className="text-brand-text-muted hover:text-brand-text-secondary absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status */}
        <select
          value={filters.status ?? 'ALL'}
          onChange={(e) => onStatusChange(e.target.value as AnnouncementStatusFilter)}
          className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 rounded border px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Visibility */}
        <select
          value={filters.visibility ?? 'ALL'}
          onChange={(e) => onVisibilityChange(e.target.value as AnnouncementVisibilityFilter)}
          className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 rounded border px-3 py-2 text-sm"
          aria-label="Filter by visibility"
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Tag */}
        <select
          value={filters.tag ?? ''}
          onChange={(e) => onTagChange((e.target.value as ContentTag) || null)}
          className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 rounded border px-3 py-2 text-sm"
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {CONTENT_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort ?? 'relevance'}
          onChange={(e) => onSortChange(e.target.value as SearchSortOption)}
          className="border-brand-secondary/30 bg-brand-surface text-brand-text-primary focus:border-brand-primary focus:ring-brand-primary/30 rounded border px-3 py-2 text-sm"
          aria-label="Sort results"
        >
          {SEARCH_SORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {SORT_LABELS[opt]}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setLocalQuery('');
              onReset();
            }}
            className="border-brand-secondary/30 bg-brand-surface text-brand-text-secondary hover:bg-brand-bg rounded border px-3 py-2 text-sm"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
