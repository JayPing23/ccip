'use client';

import ContentCard from '@/modules/content/components/ContentCard';
import SearchFilters from '@/modules/search/components/SearchFilters';
import { useSearchFilters } from '@/modules/search/hooks/useSearchFilters';
import EmptyState from '@/shared/components/EmptyState';
import Header from '@/shared/components/Header';
import MobileBottomNav from '@/shared/components/MobileBottomNav';
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
        <div className="border-brand-accent border-t-brand-primary h-12 w-12 animate-spin rounded-full border-4"></div>
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
    <main className="bg-brand-bg min-h-screen pb-20 md:pb-0">
      <Header user={user} actions={actions} />
      <MobileBottomNav />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="text-brand-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Official Feed
          </p>
          <h2 className="text-brand-text-primary mt-3 text-3xl font-bold">Announcement feed</h2>
          <p className="text-brand-text-secondary mt-2">
            Browse published campus notices in a dedicated announcement surface instead of mixing
            them with future publication or forum content.
          </p>
        </div>

        {/* Desktop: sidebar filters + content; Mobile: stacked */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters (desktop) */}
          <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72 lg:self-start">
            <SearchFilters
              filters={filters}
              onQueryChange={setQuery}
              onStatusChange={setStatus}
              onVisibilityChange={setVisibility}
              onTagChange={setTag}
              onSortChange={setSort}
              onReset={resetFilters}
            />
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {searchLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-brand-secondary/20 h-32 animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {searchError && (
              <div className="bg-status-error/10 text-status-error rounded-lg p-4">
                <p className="font-medium">Failed to load announcements</p>
                <p className="text-sm">{searchError}</p>
              </div>
            )}

            {!searchLoading && !searchError && results.items.length === 0 && (
              <EmptyState type="announcement" description="Try adjusting your search or filters." />
            )}

            {!searchLoading && !searchError && results.items.length > 0 && (
              <>
                <p className="text-brand-text-muted mb-4 text-sm">
                  {results.total} result{results.total === 1 ? '' : 's'} found
                </p>
                <div className="space-y-4">
                  {results.items.map((item) => (
                    <ContentCard key={item.content.id} content={item.content} />
                  ))}
                </div>

                {/* Pagination */}
                {results.totalPages > 1 && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-2"
                    aria-label="Pagination"
                  >
                    <button
                      type="button"
                      disabled={results.page <= 1}
                      onClick={() => setPage(results.page - 1)}
                      className="border-brand-secondary/30 rounded border px-3 py-2 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-brand-text-muted text-sm">
                      Page {results.page} of {results.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={results.page >= results.totalPages}
                      onClick={() => setPage(results.page + 1)}
                      className="border-brand-secondary/30 rounded border px-3 py-2 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
