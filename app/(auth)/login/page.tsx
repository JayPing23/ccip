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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">CCIP</h1>
          <p className="text-gray-600">Centralized Campus Information Portal</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600"></div>
        </div>
      </div>
    </div>
  );
}
