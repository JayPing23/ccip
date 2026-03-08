'use client';

import { createClient } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * OAuth Callback - /oauth-callback
 * Handles the post-OAuth flow:
 * 1. Lets Supabase auto-process the code exchange
 * 2. Validates institutional email domain
 * 3. Creates user in database automatically (no sign-up needed!)
 * 4. Redirects to dashboard
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStatus('Validating your credentials...');

        // Get the session that Supabase just established from the OAuth callback
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

        // Validate institutional domain
        if (domain !== institutionalDomain) {
          await supabase.auth.signOut();
          setError(
            `Email domain @${domain} is not allowed. Only @${institutionalDomain} accounts can access this portal.`
          );
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Create or get user in database
        setStatus('Setting up your account...');

        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        // PGRST116 means "no rows found" - expected for new users
        if (queryError && queryError.code !== 'PGRST116') {
          throw new Error('Failed to check user account');
        }

        // Auto-create user if they don't exist yet
        if (!existingUser) {
          setStatus('Creating your account...');

          const { error: createError } = await supabase.from('users').insert({
            auth_id: session.user.id,
            email: userEmail,
            full_name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url,
            institutional_domain: institutionalDomain,
          });

          if (createError) {
            throw new Error(`Account creation failed: ${createError.message}`);
          }
        }

        // Success - go to dashboard
        setStatus('Redirecting...');
        router.push('/dashboard');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        setStatus('');
        console.error('OAuth Callback Error:', err);
      }
    };

    handleAuth();
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
