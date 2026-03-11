import SignUpForm from '@/modules/auth/components/SignUpForm';
import { Suspense } from 'react';

/**
 * Sign Up Page - /signup
 * Allows new users to create accounts with email/password
 */
export default function SignUpPage() {
  return (
    <div className="from-brand-accent/10 to-brand-secondary/15 flex min-h-screen items-center justify-center bg-linear-to-br px-4">
      <div className="bg-brand-surface w-full max-w-md rounded-lg p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-brand-text-primary mb-2 text-3xl font-bold">CCIP</h1>
          <p className="text-brand-text-secondary">Centralized Campus Information Portal</p>
          <h2 className="text-brand-text-primary mt-4 text-xl font-semibold">
            Create Your Account
          </h2>
        </div>

        {/* Sign Up Form */}
        <Suspense fallback={<div className="py-4 text-center">Loading...</div>}>
          <SignUpForm />
        </Suspense>

        {/* Info Text */}
        <div className="bg-brand-accent/10 mt-6 rounded-lg p-4">
          <p className="text-brand-text-secondary text-xs">
            <strong>Institutional Email Required:</strong> You must sign up with your institutional
            email address (e.g., name@slu.edu.ph)
          </p>
        </div>

        {/* Login Link */}
        <div className="text-brand-text-secondary mt-6 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-brand-primary hover:text-brand-primary font-semibold">
            Sign in here
          </a>
        </div>
      </div>
    </div>
  );
}
