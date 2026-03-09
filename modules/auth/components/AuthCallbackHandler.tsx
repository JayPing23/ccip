'use client';

import { createClient } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * Handles the canonical post-OAuth flow for /auth-callback.
 */
export default function AuthCallbackHandler() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    let isActive = true;
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleAuth = async () => {
      try {
        if (!isActive) {
          return;
        }

        setStatus('Validating your credentials...');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.email) {
          throw new Error(sessionError?.message || 'Authentication failed');
        }

        const userEmail = session.user.email;
        const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';
        const [, domain] = userEmail.split('@');

        if (domain !== institutionalDomain) {
          await supabase.auth.signOut();

          if (!isActive) {
            return;
          }

          setError(
            `Email domain @${domain} is not allowed. Only @${institutionalDomain} accounts can access this portal.`
          );

          redirectTimeout = setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        if (!isActive) {
          return;
        }

        setStatus('Setting up your account...');

        const setupResponse = await fetch('/api/auth/setup-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            email: userEmail,
            fullName: session.user.user_metadata?.full_name || '',
            avatarUrl: session.user.user_metadata?.avatar_url,
          }),
        });

        if (!setupResponse.ok) {
          const payload = (await setupResponse.json().catch(() => null)) as
            | { error?: { message?: string } | string }
            | null;

          throw new Error(
            typeof payload?.error === 'string'
              ? payload.error
              : payload?.error?.message || 'Failed to setup user account'
          );
        }

        if (!isActive) {
          return;
        }

        setStatus('Redirecting...');
        router.push('/dashboard');
      } catch (err) {
        if (!isActive) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        setStatus('');
        console.error('OAuth Callback Error:', err);
      }
    };

    void handleAuth();

    return () => {
      isActive = false;

      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
          <p className="text-sm text-gray-600">Centralized Campus Information Portal</p>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="mt-2 text-xs text-red-600">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
            </div>
            <p className="text-gray-700">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}