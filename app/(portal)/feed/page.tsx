'use client';

import ContentCard from '@/modules/content/components/ContentCard';
import SearchFilters from '@/modules/search/components/SearchFilters';
import { useSearchFilters } from '@/modules/search/hooks/useSearchFilters';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Feed Page (Portal Home)
 * Displays all published content in a searchable, filterable feed
 */
export default function FeedPage() {
  const router = useRouter();
  const { user, loading, canCreateAnnouncements, canManageAnnouncements, canAccessAdminConsole } =
    useCurrentUser();

  const {
    filters,
    results,
    loading: searchLoading,
    error: searchError,
    setQuery,
    setStatus,
    setVisibility,
    setTag,
    setSort,
    setPage,
    resetFilters,
  } = useSearchFilters();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const actions = [] as Array<{ href: string; label: string; tone?: 'primary' | 'neutral' }>;

  if (canCreateAnnouncements) {
    actions.push({ href: '/content/create', label: 'New Announcement', tone: 'primary' });
  }

  if (canManageAnnouncements) {
    actions.push({ href: '/content/manage', label: 'Manage Announcements' });
  }

  if (canAccessAdminConsole) {
    actions.push({ href: '/admin/dashboard', label: 'Admin Console' });
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header user={user} actions={actions} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
            Official Feed
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">Announcement feed</h2>
          <p className="mt-2 text-gray-600">
            Browse published campus notices in a dedicated announcement surface instead of mixing
            them with future publication or forum content.
          </p>
        </div>

        {/* Search & filter controls */}
        <div className="mb-6">
          <SearchFilters
            filters={filters}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onVisibilityChange={setVisibility}
            onTagChange={setTag}
            onSortChange={setSort}
            onReset={resetFilters}
          />
        </div>

        {/* Results */}
        {searchLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        )}

        {searchError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-medium">Failed to load announcements</p>
            <p className="text-sm">{searchError}</p>
          </div>
        )}

        {!searchLoading && !searchError && results.items.length === 0 && (
          <div className="rounded-lg bg-blue-50 p-8 text-center">
            <p className="text-gray-700">No announcements found.</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}

        {!searchLoading && !searchError && results.items.length > 0 && (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {results.total} result{results.total === 1 ? '' : 's'} found
            </p>
            <div className="space-y-4">
              {results.items.map((item) => (
                <ContentCard key={item.content.id} content={item.content} />
              ))}
            </div>

            {/* Pagination */}
            {results.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                <button
                  type="button"
                  disabled={results.page <= 1}
                  onClick={() => setPage(results.page - 1)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {results.page} of {results.totalPages}
                </span>
                <button
                  type="button"
                  disabled={results.page >= results.totalPages}
                  onClick={() => setPage(results.page + 1)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
