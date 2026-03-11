'use client';

import EmptyState from '@/shared/components/EmptyState';
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
          <div key={i} className="bg-brand-secondary/20 h-32 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-error/10 text-status-error rounded-lg p-4">
        <p className="font-medium">Failed to load announcements</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (content.length === 0) {
    return <EmptyState type="announcement" />;
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="status-select" className="text-brand-text-secondary text-sm font-medium">
            Status:
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'PUBLISHED' | 'ALL')}
            className="border-brand-secondary/30 focus:border-brand-primary focus:ring-brand-primary rounded border px-3 py-2 text-sm"
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
