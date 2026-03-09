import AuthCallbackRedirect from '@/modules/auth/components/AuthCallbackRedirect';

export const metadata = { title: 'Authentication Redirect' };

export default function DeprecatedOAuthCallback() {
  return <AuthCallbackRedirect />;
}
