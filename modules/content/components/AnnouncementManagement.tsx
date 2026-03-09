'use client';

import { useManagedAnnouncements } from '@/modules/content/hooks/useManagedAnnouncements';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { formatDate } from '@/shared/utils/date-helpers';
import {
  canAccessContentManager,
  canDeleteAnyContent,
  canDeleteOwnContent,
  canEditAnyContent,
  canEditOwnContent,
} from '@/shared/utils/permissions';
import { useToast } from '@/shared/components/Toast';
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
        <p className="text-gray-600">Loading announcement workspace...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-gray-600">{description}</p>
        </div>
        <Link
          href="/content/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Announcement
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="mb-6 flex gap-6 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="status-filter" className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
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
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Visibility
          </label>
          <select
            id="visibility-filter"
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as typeof visibilityFilter)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="ORG_ONLY">Organization Only</option>
            <option value="DEPT_ONLY">Department Only</option>
          </select>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <p className="mb-4 text-gray-600">No announcements found for the current filters.</p>
          <Link href="/content/create" className="text-blue-600 hover:underline">
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
              <div key={announcement.id} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      {announcement.body.slice(0, 140)}
                      {announcement.body.length > 140 ? '...' : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
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
                      className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/content/${announcement.slug}/edit`}
                        className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                    )}
                    {canPublish && (
                      <button
                        onClick={() => handlePublish(announcement.id)}
                        className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
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
