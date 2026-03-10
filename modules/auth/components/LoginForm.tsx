'use client';

import { createClient } from '@/shared/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * LoginForm Component
 * Supports both email/password login and Google OAuth
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const initialTab = searchParams?.get('tab') === 'signup' ? 'google' : 'email';
  const initialError = searchParams?.get('error');

  const [tab, setTab] = useState<'email' | 'google'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? decodeURIComponent(initialError) : null
  );
  const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    let isMounted = true;

    // Check if already authenticated and redirect
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user?.email) {
          // Verify institutional domain
          if (session.user.email.endsWith(`@${institutionalDomain}`)) {
            router.push('/dashboard');
          } else {
            // Signed in with wrong domain, sign out
            await supabase.auth.signOut();
            if (isMounted) {
              setError(`Email domain must be @${institutionalDomain}`);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Auth check failed:', err);
        }
      }
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [institutionalDomain, router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Refresh session and redirect
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Supabase's native OAuth
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      // OAuth flow will redirect automatically on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">CCIP</h1>
          <p className="text-gray-600">Centralized Campus Information Portal</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => {
              setTab('email');
              setError(null);
            }}
            className={`flex-1 pb-2 font-semibold transition ${
              tab === 'email'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => {
              setTab('google');
              setError(null);
            }}
            className={`flex-1 pb-2 font-semibold transition ${
              tab === 'google'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Google
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Email/Password Tab */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                data-testid="login-email-input"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="name@slu.edu.ph"
              />
              <p className="mt-1 text-xs text-gray-500">Must be a @slu.edu.ph email address</p>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                data-testid="login-password-input"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign up here
              </button>
            </div>
          </form>
        )}

        {/* Google OAuth Tab */}
        {tab === 'google' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>

            <p className="text-center text-xs text-gray-600">
              You&apos;ll be automatically logged in if you use your institutional Google account.
            </p>
          </div>
        )}

        {/* Info Text */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-xs text-gray-700">
            <strong>Institutional Email Required:</strong> Only @{institutionalDomain} email
            addresses can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
