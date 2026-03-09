'use client';

import { CONTENT_VISIBILITY } from '@/shared/constants/content';
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
  /** Whether to show admin-only fields */
  isAdmin?: boolean;
}

/**
 * Reusable Content Form Component
 * Handles creating and editing content with validation, auto-save, and error handling
 */
export default function ContentForm({
  initialContent,
  onSuccess,
  isAdmin = false,
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
    handleDescriptionChange,
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
  const toggleTag = (tag: string) => {
    const isSelected = formData.tags.includes(tag);
    const newTags = isSelected ? formData.tags.filter((t) => t !== tag) : [...formData.tags, tag];

    setFieldValue('tags', newTags);
  };

  const isEditing = !!initialContent?.id;
  const pageTitle = isEditing ? 'Edit Announcement' : 'Create Announcement';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CCIP</h1>
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">{pageTitle}</h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Auto-save Status */}
          {isDirty && isAutoSaving && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">💾 Auto-saving draft...</p>
            </div>
          )}

          <form className="space-y-8">
            {/* Title Section */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title"
                maxLength={200}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <div className="mt-1 flex justify-between">
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                <p className="text-sm text-gray-500">{formData.title.length}/200</p>
              </div>
            </div>

            {/* Description/Body Section */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter announcement content..."
                rows={8}
                maxLength={10000}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <div className="mt-1 flex justify-between">
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                <p className="text-sm text-gray-500">{formData.description.length}/10000</p>
              </div>
            </div>

            {/* Visibility Section */}
            <div>
              <label
                htmlFor="visibility"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Visibility <span className="text-red-500">*</span>
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.visibility
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value={CONTENT_VISIBILITY.PUBLIC}>Public - Everyone can see</option>
                <option value={CONTENT_VISIBILITY.ORG_ONLY}>
                  Organization Only - Members only
                </option>
                <option value={CONTENT_VISIBILITY.DEPT_ONLY}>
                  Department Only - Department members
                </option>
              </select>
              {errors.visibility && (
                <p className="mt-1 text-sm text-red-600">{errors.visibility}</p>
              )}
            </div>

            {/* Organizations Section (if needed for restricted visibility) */}
            {formData.visibility !== CONTENT_VISIBILITY.PUBLIC && (
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Target Organizations
                </label>
                {orgsLoading ? (
                  <p className="text-gray-500">Loading organizations...</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {organizations.map((org) => (
                      <label key={org.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.org_ids.includes(org.id)}
                          onChange={() => toggleOrganization(org.id)}
                          className="h-4 w-4 rounded border border-gray-300"
                        />
                        <span className="text-gray-700">
                          {org.name} <span className="text-sm text-gray-500">({org.type})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.org_ids && <p className="mt-2 text-sm text-red-600">{errors.org_ids}</p>}
              </div>
            )}

            {/* Tags Section */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Tags <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <p className="mb-3 text-sm text-gray-600">Click to select tags</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Date (for scheduled publishing) */}
            {isAdmin && (
              <div>
                <label
                  htmlFor="scheduled_at"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Schedule for Later{' '}
                  <span className="text-xs font-normal text-gray-400">(Optional)</span>
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">Leave empty to publish immediately</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting || !formData.title || !formData.description}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : '💾 Save as Draft'}
              </button>

              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isSubmitting || !formData.title || !formData.description}
                    className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publishing...' : '🚀 Publish Now'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={
                      isSubmitting ||
                      !formData.title ||
                      !formData.description ||
                      !formData.scheduled_at
                    }
                    className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Scheduling...' : '📅 Schedule'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting || !formData.title || !formData.description}
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : '🚀 Publish'}
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="rounded-lg px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
