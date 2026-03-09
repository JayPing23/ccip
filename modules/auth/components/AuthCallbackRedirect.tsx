'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface AuthCallbackRedirectProps {
  targetPath?: string;
}

/**
 * Redirects legacy callback routes to the canonical /auth-callback page.
 */
export default function AuthCallbackRedirect({
  targetPath = '/auth-callback',
}: AuthCallbackRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryString = searchParams.toString();
    const destination = queryString ? `${targetPath}?${queryString}` : targetPath;

    router.replace(destination);
  }, [router, searchParams, targetPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
        <h1 className="text-xl font-bold text-gray-900">Redirecting...</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sending you to the current authentication callback route.
        </p>
      </div>
    </div>
  );
}