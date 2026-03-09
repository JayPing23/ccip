'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import ContentFeed from '@/modules/content/components/ContentFeed';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

/**
 * Feed Page (Portal Home)
 * Displays all published content in a feed format
 */
export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const result = await res.json();
        if (result.data) {
          setUser(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            {user?.avatar_url && (
              <Image
                src={user.avatar_url}
                alt={user.display_name || 'User avatar'}
                className="h-10 w-10 rounded-full"
                width={40}
                height={40}
                unoptimized
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
              <p className="text-sm text-gray-600">Centralized Campus Information Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-gray-900">{user?.display_name || 'User'}</p>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Announcements</h2>
          <p className="mt-2 text-gray-600">Stay updated with announcements from your campus</p>
        </div>

        {/* Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => router.push('/content/create')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            + New Announcement
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-900 transition hover:bg-gray-300"
          >
            Admin Panel
          </button>
        </div>

        {/* Content Feed */}
        <ContentFeed visibility="PUBLIC" showFilters={true} />
      </div>
    </main>
  );
}
