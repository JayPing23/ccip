'use client';

import { useManagedAnnouncements } from '@/modules/content/hooks/useManagedAnnouncements';
import { useToast } from '@/shared/components/Toast';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { formatDate } from '@/shared/utils/date-helpers';
import {
  canAccessContentManager,
  canDeleteAnyContent,
  canDeleteOwnContent,
  canEditAnyContent,
  canEditOwnContent,
} from '@/shared/utils/permissions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AnnouncementManagementProps {
  title?: string;
  description?: string;
}

export default function AnnouncementManagement({
  title = 'Manage Announcements',
  description = 'Review, publish, and maintain official announcements from the content module.',
}: AnnouncementManagementProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, loading: userLoading } = useCurrentUser();
  const {
    announcements,
    loading,
    error,
    statusFilter,
    visibilityFilter,
    setStatusFilter,
    setVisibilityFilter,
    publishAnnouncement,
    deleteAnnouncement,
  } = useManagedAnnouncements();

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.role_name || !canAccessContentManager(user.role_name)) {
      router.replace('/dashboard');
    }
  }, [router, user, userLoading]);

  const handlePublish = async (announcementId: string) => {
    try {
      await publishAnnouncement(announcementId);
      showToast('Announcement published', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish announcement', 'error');
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!window.confirm('Are you sure? This announcement will be soft-deleted.')) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId);
      showToast('Announcement deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete announcement', 'error');
    }
  };

  const canEditAnnouncement = (announcementAuthorId: string) => {
    if (!user?.role_name) {
      return false;
    }

    const isOwner = announcementAuthorId === user.id;

    return isOwner ? canEditOwnContent(user.role_name) : canEditAnyContent(user.role_name);
  };

  const canDeleteAnnouncement = (announcementAuthorId: string) => {
    if (!user?.role_name) {
      return false;
    }

    const isOwner = announcementAuthorId === user.id;

    return isOwner ? canDeleteOwnContent(user.role_name) : canDeleteAnyContent(user.role_name);
  };

  if (userLoading || (loading && !announcements.length)) {
    return (
      <div className="py-12 text-center">
        <p className="text-brand-text-secondary">Loading announcement workspace...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8" data-testid="announcement-management">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-brand-text-primary text-2xl font-bold">{title}</h2>
          <p className="text-brand-text-secondary mt-1">{description}</p>
        </div>
        <Link
          href="/content/create"
          className="bg-brand-primary hover:bg-brand-primary/80 rounded-lg px-4 py-2 text-white"
        >
          New Announcement
        </Link>
      </div>

      {error && (
        <div className="border-status-error/20 bg-status-error/10 mb-6 rounded-lg border p-4">
          <p className="text-status-error">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="bg-brand-surface mb-6 flex gap-6 rounded-lg p-6 shadow-sm">
        <div>
          <label
            htmlFor="status-filter"
            className="text-brand-text-secondary mb-2 block text-sm font-medium"
          >
            Status
          </label>
          <select
            id="status-filter"
            data-testid="announcement-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="border-brand-secondary/30 rounded border px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="visibility-filter"
            className="text-brand-text-secondary mb-2 block text-sm font-medium"
          >
            Visibility
          </label>
          <select
            id="visibility-filter"
            data-testid="announcement-visibility-filter"
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as typeof visibilityFilter)}
            className="border-brand-secondary/30 rounded border px-3 py-2 text-sm"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="ORG_ONLY">Organization Only</option>
            <option value="DEPT_ONLY">Department Only</option>
          </select>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-brand-surface rounded-lg p-12 text-center shadow-sm">
          <p className="text-brand-text-secondary mb-4">
            No announcements found for the current filters.
          </p>
          <Link href="/content/create" className="text-brand-primary hover:underline">
            Create the first announcement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const canEdit = canEditAnnouncement(announcement.author_id);
            const canDelete = canDeleteAnnouncement(announcement.author_id);
            const canPublish = canEdit && announcement.status === 'DRAFT';

            return (
              <div
                key={announcement.id}
                data-testid="announcement-card"
                data-announcement-id={announcement.id}
                className="bg-brand-surface rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3
                      data-testid="announcement-title"
                      className="text-brand-text-primary mb-2 text-lg font-semibold"
                    >
                      {announcement.title}
                    </h3>
                    <p className="text-brand-text-secondary mb-3 text-sm">
                      {announcement.body.slice(0, 140)}
                      {announcement.body.length > 140 ? '...' : ''}
                    </p>
                    <div className="text-brand-text-muted flex flex-wrap items-center gap-2 text-sm">
                      <span
                        data-testid="announcement-status"
                        className="bg-brand-secondary/10 text-brand-text-secondary rounded-full px-3 py-1 font-medium"
                      >
                        {announcement.status}
                      </span>
                      <span>{announcement.visibility}</span>
                      {announcement.scheduled_at && (
                        <span>Scheduled: {formatDate(announcement.scheduled_at)}</span>
                      )}
                      <span className="ml-auto">Updated {formatDate(announcement.updated_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/content/${announcement.slug}`}
                      className="border-brand-secondary/20 text-brand-text-secondary hover:bg-brand-bg rounded border px-3 py-2 text-sm"
                    >
                      View
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/content/${announcement.slug}/edit`}
                        className="bg-brand-primary hover:bg-brand-primary/80 rounded px-3 py-2 text-sm text-white"
                      >
                        Edit
                      </Link>
                    )}
                    {canPublish && (
                      <button
                        onClick={() => handlePublish(announcement.id)}
                        data-testid="announcement-publish-button"
                        className="bg-status-success hover:bg-status-success/80 rounded px-3 py-2 text-sm text-white"
                      >
                        Publish
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        data-testid="announcement-delete-button"
                        className="bg-status-error hover:bg-status-error/80 rounded px-3 py-2 text-sm text-white"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
