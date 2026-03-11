'use client';

import type { ArticleSection } from '@/modules/publication/constants';
import { ARTICLE_SECTIONS, ARTICLE_SECTION_LABELS } from '@/modules/publication/constants';
import { useArticleEditor } from '@/modules/publication/hooks/useArticleEditor';
import type { IArticle } from '@/modules/publication/types';
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
    DRAFT: 'bg-brand-secondary/10 text-brand-text-primary',
    IN_REVIEW: 'bg-status-warning/15 text-status-warning',
    APPROVED: 'bg-brand-accent/15 text-brand-primary',
    PUBLISHED: 'bg-status-success/15 text-status-success',
    ARCHIVED: 'bg-status-error/15 text-status-error',
  };

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
            &larr; Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="bg-brand-surface rounded-lg p-8 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-brand-text-primary text-3xl font-bold">{pageTitle}</h2>
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
            <div className="border-status-warning/20 bg-status-warning/10 mb-6 rounded-lg border p-4">
              <p className="text-status-warning text-sm font-medium">
                Revision requested: {initialArticle.review_note}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="border-status-success/20 bg-status-success/10 mb-6 rounded-lg border p-4">
              <p className="text-status-success font-medium">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="border-status-error/20 bg-status-error/10 mb-6 rounded-lg border p-4">
              <p className="text-status-error font-medium">{errorMessage}</p>
            </div>
          )}

          {isDirty && isAutoSaving && (
            <div className="border-brand-accent/20 bg-brand-accent/10 mb-6 rounded-lg border p-4">
              <p className="text-brand-primary text-sm font-medium">Auto-saving draft...</p>
            </div>
          )}

          <form onSubmit={handleSaveDraft} className="space-y-8">
            {/* Title */}
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
                value={formData.title}
                onChange={handleChange}
                disabled={!canEdit}
                placeholder="Enter article title"
                maxLength={300}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.title
                    ? 'border-status-error focus:ring-status-error/20'
                    : 'border-brand-secondary/30 focus:ring-brand-primary/20'
                } disabled:bg-brand-secondary/10`}
              />
              {errors.title && <p className="text-status-error mt-1 text-sm">{errors.title}</p>}
            </div>

            {/* Section select */}
            <div>
              <label
                htmlFor="section"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
                Section <span className="text-status-error">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={(e) => setFieldValue('section', e.target.value as ArticleSection)}
                disabled={!canEdit}
                className="border-brand-secondary/30 focus:ring-brand-primary/20 disabled:bg-brand-secondary/10 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
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
                  className="text-brand-text-secondary mb-2 block text-sm font-semibold"
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
                  className="border-brand-secondary/30 focus:ring-brand-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                />
              </div>
            )}

            {/* Excerpt */}
            <div>
              <label
                htmlFor="excerpt"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
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
                className="border-brand-secondary/30 focus:ring-brand-primary/20 disabled:bg-brand-secondary/10 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              />
              <p className="text-brand-text-muted mt-1 text-xs">{formData.excerpt.length}/500</p>
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="body"
                className="text-brand-text-secondary mb-2 block text-sm font-semibold"
              >
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
                className="border-brand-secondary/30 focus:ring-brand-primary/20 disabled:bg-brand-secondary/10 w-full rounded-lg border px-4 py-2 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
              />
              {errors.body && <p className="text-status-error mt-1 text-sm">{errors.body}</p>}
            </div>

            {/* Media placeholder */}
            <div className="border-brand-secondary/30 rounded-lg border-2 border-dashed p-6 text-center">
              <p className="text-brand-text-muted text-sm">
                Media attachments will be supported in a future phase.
              </p>
            </div>

            {/* Actions */}
            <div className="border-brand-secondary/20 flex items-center gap-3 border-t pt-6">
              {canEdit && (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-primary hover:bg-brand-primary/80 rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Draft' : 'Create Draft'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitForReview}
                      className="bg-status-warning hover:bg-status-warning/80 rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Submit for Review
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => router.back()}
                className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded-lg border px-6 py-2 text-sm font-medium"
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
