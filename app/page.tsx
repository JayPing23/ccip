// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Home Page (Root / - Route)
 * Redirects authenticated users to dashboard and unauthenticated users to login
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          // User is authenticated, go to dashboard
          router.push('/dashboard');
        } else {
          // User is not authenticated, go to login
          router.push('/login');
        }
      } catch {
        // Error checking auth, go to login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600 mx-auto"></div>
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
