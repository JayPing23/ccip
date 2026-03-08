'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useContent } from '../hooks/useContent';
import ContentCard from './ContentCard';

interface ContentFeedProps {
  visibility?: 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY';
  showFilters?: boolean;
}

/**
 * ContentFeed Component
 * Displays a feed of announcements with optional filtering
 */
export default function ContentFeed({
  visibility = 'PUBLIC',
  showFilters = true,
}: ContentFeedProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'PUBLISHED' | 'ALL'>('PUBLISHED');
  const { content, loading, error } = useContent({
    visibility,
    status: statusFilter === 'ALL' ? undefined : 'PUBLISHED',
  });

  const handleDelete = () => {
    // Trigger a refresh by re-fetching
    router.refresh();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load announcements</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-8 text-center">
        <p className="text-gray-700">No announcements yet.</p>
        <p className="text-sm text-gray-500">Check back soon for updates!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'PUBLISHED' | 'ALL')}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="PUBLISHED">Published</option>
            <option value="ALL">All</option>
          </select>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {content.map((item) => (
          <ContentCard key={item.id} content={item} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
