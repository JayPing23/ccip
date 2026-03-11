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
    <div className="from-brand-accent/10 to-brand-secondary/15 flex min-h-screen items-center justify-center bg-linear-to-br">
      <div className="bg-brand-surface w-full max-w-md rounded-lg p-8 text-center shadow-lg">
        <div className="border-brand-secondary border-t-brand-primary mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4"></div>
        <h1 className="text-brand-text-primary text-xl font-bold">Redirecting...</h1>
        <p className="text-brand-text-secondary mt-2 text-sm">
          Sending you to the current authentication callback route.
        </p>
      </div>
    </div>
  );
}
