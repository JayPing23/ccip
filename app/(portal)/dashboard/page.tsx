'use client';

import LogoutButton from '@/modules/auth/components/LogoutButton';
import ContentFeed from '@/modules/content/components/ContentFeed';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role_id?: string;
  role_name?: string;
  created_at?: string;
}

/**
 * Dashboard Page (Portal Home)
 * Protected route - shows user info and content feed
 */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        const result = await res.json();
        if (result.data) {
          setUser(result.data);
        } else {
          throw new Error('Failed to load user data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="mb-4 text-red-700">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CCIP</h1>
            <p className="text-sm text-gray-600">Centralized Campus Information Portal</p>
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
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="mt-2 text-gray-600">Here are the latest announcements from your campus</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => router.push('/feed')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            View All Announcements
          </button>
          {user?.role_name &&
            ['DEPT_EDITOR', 'UNIVERSITY_EDITOR', 'SUPER_ADMIN'].includes(user.role_name) && (
              <>
                <button
                  onClick={() => router.push('/content/create')}
                  className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                >
                  📝 New Post
                </button>
                <button
                  onClick={() => router.push('/admin/content')}
                  className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white transition hover:bg-purple-700"
                >
                  📋 Manage Posts
                </button>
              </>
            )}
          {user?.role_name === 'SUPER_ADMIN' && (
            <button
              onClick={() => router.push('/admin')}
              className="rounded-lg bg-gray-700 px-6 py-2 font-medium text-white transition hover:bg-gray-800"
            >
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {/* Recent Content Feed */}
        <ContentFeed visibility="PUBLIC" showFilters={false} />
      </main>
    </div>
  );
}
