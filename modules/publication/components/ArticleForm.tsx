'use client';

import { ARTICLE_SECTIONS, ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import type { ArticleSection } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import { useArticleEditor } from '@/modules/publication/hooks/useArticleEditor';
import { useRouter } from 'next/navigation';

interface ArticleFormProps {
  initialArticle?: IArticle | null;
  onSuccess?: (article: IArticle) => void;
}

/**
 * Article Form Component
 * Handles creating and editing publication articles with bylines, sections,
 * workflow state display, and media-ready structure.
 */
export default function ArticleForm({ initialArticle, onSuccess }: ArticleFormProps) {
  const router = useRouter();

  const {
    formData,
    errors,
    isSubmitting,
    isAutoSaving,
    successMessage,
    errorMessage,
    isDirty,
    workflowStatus,
    handleChange,
    setFieldValue,
    handleSaveDraft,
    submitForReview,
  } = useArticleEditor({ initialArticle, onSuccess });

  const isEditing = !!initialArticle?.id;
  const pageTitle = isEditing ? 'Edit Article' : 'Create Article';
  const canEdit = workflowStatus === 'DRAFT';

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    IN_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

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
            &larr; Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">{pageTitle}</h2>
            {isEditing && (
              <span
                className={`inline-block rounded px-3 py-1 text-xs font-medium ${statusColors[workflowStatus] ?? ''}`}
              >
                {workflowStatus.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Review note banner */}
          {initialArticle?.review_note && workflowStatus === 'DRAFT' && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-800">
                Revision requested: {initialArticle.review_note}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {isDirty && isAutoSaving && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">Auto-saving draft...</p>
            </div>
          )}

          <form onSubmit={handleSaveDraft} className="space-y-8">
            {/* Title */}
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
                disabled={!canEdit}
                placeholder="Enter article title"
                maxLength={300}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                } disabled:bg-gray-100`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Section select */}
            <div>
              <label htmlFor="section" className="mb-2 block text-sm font-semibold text-gray-700">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={(e) => setFieldValue('section', e.target.value as ArticleSection)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100"
              >
                {Object.entries(ARTICLE_SECTIONS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {ARTICLE_SECTION_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            {/* Byline (only on create) */}
            {!isEditing && (
              <div>
                <label
                  htmlFor="byline_name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Byline Name
                </label>
                <input
                  type="text"
                  id="byline_name"
                  name="byline_name"
                  value={formData.byline_name}
                  onChange={handleChange}
                  placeholder="Your name as it appears on the article"
                  maxLength={200}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>
            )}

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-gray-700">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                disabled={!canEdit}
                placeholder="Brief summary of the article (shown in listings)"
                maxLength={500}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.excerpt.length}/500</p>
            </div>

            {/* Body */}
            <div>
              <label htmlFor="body" className="mb-2 block text-sm font-semibold text-gray-700">
                Body
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                disabled={!canEdit}
                placeholder="Write your article content here..."
                rows={16}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100"
              />
              {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
            </div>

            {/* Media placeholder */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500">
                Media attachments will be supported in a future phase.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
              {canEdit && (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Draft' : 'Create Draft'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitForReview}
                      className="rounded-lg bg-yellow-500 px-6 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Submit for Review
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
