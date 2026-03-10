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
          <div key={i} className="h-20 rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
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
          className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="mt-1 text-sm text-gray-500">{category.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
