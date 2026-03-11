'use client';

import { createClient } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * LogoutButton Component
 * Handles user logout using Supabase auth
 */
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Sign out from Supabase
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      // Clear session cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        console.warn('Failed to clear server-side session');
      }

      // Redirect to login page
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="mb-2 text-sm text-status-error">{error}</p>}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="rounded-lg bg-status-error px-4 py-2 text-white transition hover:bg-status-error/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
