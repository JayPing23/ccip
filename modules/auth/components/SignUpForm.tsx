'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * SignUpForm Component
 * Handles email/password user registration
 */
export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Client-side validation
      if (!formData.email || !formData.password || !formData.displayName) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      const institutionalDomain = process.env.NEXT_PUBLIC_INSTITUTIONAL_DOMAIN || 'slu.edu.ph';
      const [, domain] = formData.email.split('@');

      if (domain !== institutionalDomain) {
        setError(`Only @${institutionalDomain} email addresses are allowed`);
        setLoading(false);
        return;
      }

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          displayName: formData.displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setFormData({
        email: '',
        displayName: '',
        password: '',
        confirmPassword: '',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?tab=signin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-status-success/10 border border-status-success/20 rounded-lg">
        <div className="text-center">
          <div className="text-4xl text-status-success mb-4">✓</div>
          <h2 className="text-xl font-semibold text-status-success mb-2">Account Created!</h2>
          <p className="text-status-success"> Your account has been created successfully.</p>
          <p className="text-sm text-status-success mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Full Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={formData.displayName}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-brand-secondary/30 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            placeholder="e.g., Juan Dela Cruz"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-brand-secondary/30 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            placeholder="name@slu.edu.ph"
          />
          <p className="text-xs text-brand-text-muted mt-1">Must be a @slu.edu.ph email address</p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-brand-secondary/30 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-brand-secondary/30 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/80 disabled:bg-brand-secondary text-white font-semibold py-2 rounded-lg transition duration-200"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
