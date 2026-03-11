'use client';

import type { IForumCategory } from '@/modules/forum/types';
import Link from 'next/link';

interface ForumCategoryListProps {
  categories: IForumCategory[];
  loading?: boolean;
  error?: string | null;
}

export default function ForumCategoryList({ categories, loading, error }: ForumCategoryListProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-brand-secondary/20 h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-status-error/20 bg-status-error/10 text-status-error rounded-lg border p-4 text-sm">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-brand-surface border-brand-secondary/20 text-brand-text-muted rounded-lg border p-8 text-center">
        No forum categories available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/forum/${category.slug}`}
          className="bg-brand-surface border-brand-secondary/20 hover:border-brand-accent block rounded-lg border p-4 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-sm"
        >
          <div className="bg-content-forum mb-3 h-1 w-10 rounded-full" />
          <h3 className="text-brand-text-primary text-lg font-semibold">{category.name}</h3>
          {category.description && (
            <p className="text-brand-text-muted mt-1 text-sm">{category.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
