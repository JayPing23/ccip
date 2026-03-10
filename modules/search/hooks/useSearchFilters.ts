'use client';

import type {
  AnnouncementSearchParams,
  AnnouncementStatusFilter,
  AnnouncementVisibilityFilter,
  SearchResultSet,
  SearchSortOption,
} from '@/modules/search/types';
import { SEARCH_DEFAULTS } from '@/modules/search/types';
import type { ContentTag } from '@/shared/constants/tags';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

function paramsToFilters(sp: URLSearchParams): AnnouncementSearchParams {
  return {
    query: sp.get('q') || undefined,
    status: (sp.get('status') as AnnouncementStatusFilter) || undefined,
    visibility: (sp.get('visibility') as AnnouncementVisibilityFilter) || undefined,
    tag: (sp.get('tag') as ContentTag) || undefined,
    organizationId: sp.get('org') || undefined,
    sort: (sp.get('sort') as SearchSortOption) || SEARCH_DEFAULTS.SORT,
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || SEARCH_DEFAULTS.PAGE_SIZE,
  };
}

function filtersToParams(filters: AnnouncementSearchParams): URLSearchParams {
  const sp = new URLSearchParams();

  if (filters.query) sp.set('q', filters.query);
  if (filters.status && filters.status !== 'ALL') sp.set('status', filters.status);
  if (filters.visibility && filters.visibility !== 'ALL') sp.set('visibility', filters.visibility);
  if (filters.tag) sp.set('tag', filters.tag);
  if (filters.organizationId) sp.set('org', filters.organizationId);
  if (filters.sort && filters.sort !== SEARCH_DEFAULTS.SORT) sp.set('sort', filters.sort);
  if (filters.page && filters.page > 1) sp.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== SEARCH_DEFAULTS.PAGE_SIZE) {
    sp.set('pageSize', String(filters.pageSize));
  }

  return sp;
}

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = paramsToFilters(searchParams);

  const [results, setResults] = useState<SearchResultSet>({
    items: [],
    total: 0,
    page: 1,
    pageSize: SEARCH_DEFAULTS.PAGE_SIZE,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- URL mutation helpers --------------------------------------------------

  const pushFilters = useCallback(
    (next: AnnouncementSearchParams) => {
      const sp = filtersToParams(next);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname]
  );

  const setQuery = useCallback(
    (q: string) => pushFilters({ ...filters, query: q || undefined, page: 1 }),
    [pushFilters, filters]
  );

  const setStatus = useCallback(
    (status: AnnouncementStatusFilter) => pushFilters({ ...filters, status, page: 1 }),
    [pushFilters, filters]
  );

  const setVisibility = useCallback(
    (visibility: AnnouncementVisibilityFilter) => pushFilters({ ...filters, visibility, page: 1 }),
    [pushFilters, filters]
  );

  const setTag = useCallback(
    (tag: ContentTag | null) => pushFilters({ ...filters, tag: tag ?? undefined, page: 1 }),
    [pushFilters, filters]
  );

  const setSort = useCallback(
    (sort: SearchSortOption) => pushFilters({ ...filters, sort, page: 1 }),
    [pushFilters, filters]
  );

  const setPage = useCallback(
    (page: number) => pushFilters({ ...filters, page }),
    [pushFilters, filters]
  );

  const resetFilters = useCallback(
    () => pushFilters({ page: 1, pageSize: SEARCH_DEFAULTS.PAGE_SIZE }),
    [pushFilters]
  );

  // -- Fetch with debounce ---------------------------------------------------

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (params: AnnouncementSearchParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const apiParams = filtersToParams(params);
      // Always include page/pageSize for the API call even if they are defaults.
      apiParams.set('page', String(params.page ?? 1));
      apiParams.set('pageSize', String(params.pageSize ?? SEARCH_DEFAULTS.PAGE_SIZE));

      const response = await fetch(`/api/search?${apiParams.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const json = await response.json();
      setResults(
        json.data ?? {
          items: [],
          total: 0,
          page: 1,
          pageSize: SEARCH_DEFAULTS.PAGE_SIZE,
          totalPages: 0,
        }
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever URL-derived filters change, with debounce for query text.
  const serializedParams = searchParams.toString();

  useEffect(() => {
    const current = paramsToFilters(new URLSearchParams(serializedParams));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(
      () => {
        void fetchResults(current);
      },
      current.query ? DEBOUNCE_MS : 0
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serializedParams, fetchResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    // Current filter state (derived from URL)
    filters,

    // Results
    results,
    loading,
    error,

    // Setters
    setQuery,
    setStatus,
    setVisibility,
    setTag,
    setSort,
    setPage,
    resetFilters,
  };
}
