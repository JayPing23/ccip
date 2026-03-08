import { Suspense } from 'react';
import SignUpForm from '@/modules/auth/components/SignUpForm';

/**
 * Sign Up Page - /signup
 * Allows new users to create accounts with email/password
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">CCIP</h1>
          <p className="text-gray-600">Centralized Campus Information Portal</p>
          <h2 className="text-xl font-semibold text-gray-800 mt-4">Create Your Account</h2>
        </div>

        {/* Sign Up Form */}
        <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
          <SignUpForm />
        </Suspense>

        {/* Info Text */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-xs text-gray-700">
            <strong>Institutional Email Required:</strong> You must sign up with your institutional
            email address (e.g., name@slu.edu.ph)
          </p>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign in here
          </a>
        </div>
      </div>
    </div>
  );
}
