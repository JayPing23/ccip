import LoginForm from '@/modules/auth/components/LoginForm';
import { Suspense } from 'react';

/**
 * Login Page
 * Handles authentication via Supabase's native Google OAuth
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <div className="from-brand-accent/10 to-brand-secondary/15 flex min-h-screen items-center justify-center bg-linear-to-br px-4">
      <div className="bg-brand-surface w-full max-w-md rounded-lg p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-brand-text-primary mb-2 text-3xl font-bold">CCIP</h1>
          <p className="text-brand-text-secondary">Centralized Campus Information Portal</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="border-brand-secondary border-t-brand-primary h-12 w-12 animate-spin rounded-full border-4"></div>
        </div>
      </div>
    </div>
  );
}
