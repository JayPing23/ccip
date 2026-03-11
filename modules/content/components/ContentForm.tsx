'use client';

import { ANNOUNCEMENT_VISIBILITY } from '@/modules/content/constants';
import type { ContentTag } from '@/shared/constants/tags';
import { CONTENT_TAGS } from '@/shared/constants/tags';
import type { IContent, IOrganization } from '@/shared/types/database.types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useContentForm } from '../hooks/useContentForm';

interface ContentFormProps {
  /** Initial content to edit (if editing), undefined for new content */
  initialContent?: IContent | null;
  /** Callback when form is successfully submitted */
  onSuccess?: (content: IContent) => void;
  /** Whether publishing and scheduling controls should be available */
  canManagePublishing?: boolean;
}

/**
 * Reusable Content Form Component
 * Handles creating and editing content with validation, auto-save, and error handling
 */
export default function ContentForm({
  initialContent,
  onSuccess,
  canManagePublishing = false,
}: ContentFormProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  const {
    formData,
    errors,
    isSubmitting,
    isAutoSaving,
    successMessage,
    errorMessage,
    isDirty,
    handleChange,
    handleBodyChange,
    handleSaveDraft,
    handlePublish,
    handleSchedule,
    handleReset,
    setFieldValue,
  } = useContentForm({ initialContent, onSuccess });

  // Fetch organizations for multi-select
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        setOrgsLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  /**
   * Toggle organization selection
   */
  const toggleOrganization = (orgId: string) => {
    const isSelected = formData.org_ids.includes(orgId);
    const newOrgIds = isSelected
      ? formData.org_ids.filter((id) => id !== orgId)
      : [...formData.org_ids, orgId];

    setFieldValue('org_ids', newOrgIds);
  };

  /**
   * Toggle tag selection
   */
  const toggleTag = (tag: ContentTag) => {
    const isSelected = formData.tags.includes(tag);
    const newTags = isSelected ? formData.tags.filter((t) => t !== tag) : [...formData.tags, tag];

    setFieldValue('tags', newTags);
  };

  const isEditing = !!initialContent?.id;
  const pageTitle = isEditing ? 'Edit Announcement' : 'Create Announcement';

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Header */}
      <header className="border-brand-secondary/20 bg-brand-surface sticky top-0 z-10 border-b shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-brand-text-primary text-2xl font-bold">CCIP</h1>
          <button
            onClick={() => router.back()}
            className="text-brand-text-secondary hover:text-brand-text-primary text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="bg-brand-surface rounded-lg p-8 shadow">
          <h2 className="text-brand-text-primary mb-6 text-3xl font-bold">{pageTitle}</h2>

          {/* Success Message */}
          {successMessage && (
            <div className="border-status-success/20 bg-status-success/10 mb-6 rounded-lg border p-4">
              <p className="text-status-success font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="border-status-error/20 bg-status-error/10 mb-6 rounded-lg border p-4">
              <p className="text-status-error font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Auto-save Status */}
          {isDirty && isAutoSaving && (
            <div className="border-brand-accent/20 bg-brand-accent/10 mb-6 rounded-lg border p-4">
              <p className="text-brand-primary text-sm font-medium">💾 Auto-saving draft...</p>
            </div>
          )}

          <form className="space-y-8">
            {/* Title Section */}
            <div>
              <label
                htmlFor="title"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
                Title <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                data-testid="content-title-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title"
                maxLength={200}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.title
                    ? 'border-status-error focus:ring-status-error'
                    : 'border-brand-secondary/30 focus:ring-brand-primary'
                }`}
              />
              <div className="mt-1 flex justify-between">
                {errors.title && <p className="text-status-error text-sm">{errors.title}</p>}
                <p className="text-brand-text-muted text-sm">{formData.title.length}/200</p>
              </div>
            </div>

            {/* Body Section */}
            <div>
              <label
                htmlFor="body"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
                Content <span className="text-status-error">*</span>
              </label>
              <textarea
                id="body"
                name="body"
                data-testid="content-body-input"
                value={formData.body}
                onChange={handleBodyChange}
                placeholder="Enter announcement content..."
                rows={8}
                maxLength={10000}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.body
                    ? 'border-status-error focus:ring-status-error'
                    : 'border-brand-secondary/30 focus:ring-brand-primary'
                }`}
              />
              <div className="mt-1 flex justify-between">
                {errors.body && <p className="text-status-error text-sm">{errors.body}</p>}
                <p className="text-brand-text-muted text-sm">{formData.body.length}/10000</p>
              </div>
            </div>

            {/* Visibility Section */}
            <div>
              <label
                htmlFor="visibility"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
                Visibility <span className="text-status-error">*</span>
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.visibility
                    ? 'border-status-error focus:ring-status-error'
                    : 'border-brand-secondary/30 focus:ring-brand-primary'
                }`}
              >
                <option value={ANNOUNCEMENT_VISIBILITY.PUBLIC}>Public - Everyone can see</option>
                <option value={ANNOUNCEMENT_VISIBILITY.ORG_ONLY}>
                  Organization Only - Members only
                </option>
                <option value={ANNOUNCEMENT_VISIBILITY.DEPT_ONLY}>
                  Department Only - Department members
                </option>
              </select>
              {errors.visibility && (
                <p className="text-status-error mt-1 text-sm">{errors.visibility}</p>
              )}
            </div>

            {/* Organizations Section (if needed for restricted visibility) */}
            {formData.visibility !== ANNOUNCEMENT_VISIBILITY.PUBLIC && (
              <div>
                <label className="text-brand-text-secondary mb-3 block text-sm font-semibold">
                  Target Organizations
                </label>
                {orgsLoading ? (
                  <p className="text-brand-text-muted">Loading organizations...</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {organizations.map((org) => (
                      <label key={org.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.org_ids.includes(org.id)}
                          onChange={() => toggleOrganization(org.id)}
                          className="border-brand-secondary/30 h-4 w-4 rounded border"
                        />
                        <span className="text-brand-text-secondary">
                          {org.name}{' '}
                          <span className="text-brand-text-muted text-sm">({org.type})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.org_ids && (
                  <p className="text-status-error mt-2 text-sm">{errors.org_ids}</p>
                )}
              </div>
            )}

            {/* Tags Section */}
            <div>
              <label className="text-brand-text-secondary mb-3 block text-sm font-semibold">
                Tags <span className="text-brand-text-muted text-xs font-normal">(Optional)</span>
              </label>
              <p className="text-brand-text-secondary mb-3 text-sm">Click to select tags</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-brand-accent text-white'
                        : 'bg-brand-secondary/20 text-brand-text-secondary hover:bg-brand-secondary/30'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Date (for scheduled publishing) */}
            {canManagePublishing && (
              <div>
                <label
                  htmlFor="scheduled_at"
                  className="text-brand-text-secondary mb-2 block text-sm font-semibold"
                >
                  Schedule for Later{' '}
                  <span className="text-brand-text-muted text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_at"
                  name="scheduled_at"
                  value={
                    formData.scheduled_at
                      ? new Date(formData.scheduled_at).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={handleChange}
                  className="border-brand-secondary/30 focus:ring-brand-primary w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                />
                <p className="text-brand-text-muted mt-1 text-sm">
                  Leave empty to publish immediately
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-brand-secondary/20 flex flex-col gap-4 border-t pt-6 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveDraft}
                data-testid="content-save-draft-button"
                disabled={isSubmitting || !formData.title || !formData.body}
                className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg flex-1 rounded-lg border px-6 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : '💾 Save as Draft'}
              </button>

              {canManagePublishing ? (
                <>
                  <button
                    type="button"
                    onClick={handlePublish}
                    data-testid="content-publish-button"
                    disabled={isSubmitting || !formData.title || !formData.body}
                    className="bg-brand-primary hover:bg-brand-primary/80 flex-1 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publishing...' : '🚀 Publish Now'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={
                      isSubmitting || !formData.title || !formData.body || !formData.scheduled_at
                    }
                    className="bg-status-success hover:bg-status-success/80 flex-1 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Scheduling...' : '📅 Schedule'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  data-testid="content-publish-button"
                  disabled={isSubmitting || !formData.title || !formData.body}
                  className="bg-brand-primary hover:bg-brand-primary/80 flex-1 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : '🚀 Publish'}
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="text-brand-text-secondary hover:bg-brand-secondary/10 rounded-lg px-6 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            {/* Dirty State Indicator */}
            {isDirty && !isAutoSaving && (
              <p className="text-sm text-amber-600">
                ⚠️ You have unsaved changes (auto-saving in 30 seconds)
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
