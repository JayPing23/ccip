'use client';

import ContentForm from '@/modules/content/components/ContentForm';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { canSchedulePosts } from '@/shared/utils/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Create Content Page
 * Allows authenticated users to create new announcements
 */
export default function CreateContentPage() {
  const router = useRouter();
  const { user, loading, canCreateAnnouncements } = useCurrentUser();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!canCreateAnnouncements) {
      router.replace('/dashboard');
    }
  }, [canCreateAnnouncements, loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <p className="text-brand-text-secondary">Loading editor workspace...</p>
      </div>
    );
  }

  return (
    <ContentForm canManagePublishing={user.role_name ? canSchedulePosts(user.role_name) : false} />
  );
}
