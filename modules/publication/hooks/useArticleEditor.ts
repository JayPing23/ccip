'use client';

import type { ArticleSection, ArticleStatus } from '@/modules/publication/constants';
import { ARTICLE_STATUS } from '@/modules/publication/constants';
import type { IArticle } from '@/modules/publication/types';
import {
  articleCreateSchema,
  articleUpdateSchema,
} from '@/modules/publication/schemas/article.schema';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ArticleFormState {
  title: string;
  body: string;
  excerpt: string;
  section: ArticleSection;
  byline_name: string;
}

interface FormErrors {
  [key: string]: string;
}

interface UseArticleEditorOptions {
  initialArticle?: IArticle | null;
  onSuccess?: (article: IArticle) => void;
}

/**
 * Hook for managing article form state, validation, and submission.
 * Handles both create and update operations with auto-save drafts.
 */
export function useArticleEditor(options: UseArticleEditorOptions = {}) {
  const router = useRouter();
  const { initialArticle, onSuccess } = options;

  const defaultFormState = useMemo<ArticleFormState>(
    () => ({
      title: initialArticle?.title ?? '',
      body: initialArticle?.body ?? '',
      excerpt: initialArticle?.excerpt ?? '',
      section: (initialArticle?.section ?? 'NEWS') as ArticleSection,
      byline_name: '',
    }),
    [initialArticle]
  );

  const [formData, setFormData] = useState<ArticleFormState>(defaultFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const draftSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDraftRef = useRef<string>('');

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(defaultFormState);
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDirty(false);
    lastSavedDraftRef.current = '';
  }, [defaultFormState]);

  /** Current workflow status (from the server-side article or DRAFT for new). */
  const workflowStatus: ArticleStatus = initialArticle?.status ?? ARTICLE_STATUS.DRAFT;

  const setFieldValue = useCallback(
    <K extends keyof ArticleFormState>(name: K, value: ArticleFormState[K]) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.currentTarget;
      setFieldValue(name as keyof ArticleFormState, value as never);
    },
    [setFieldValue]
  );

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateForm = useCallback((): boolean => {
    const schema = initialArticle?.id ? articleUpdateSchema : articleCreateSchema;
    const result = schema.safeParse({
      title: formData.title,
      body: formData.body || undefined,
      excerpt: formData.excerpt || undefined,
      section: formData.section,
      byline_name: formData.byline_name || undefined,
    });

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData, initialArticle]);

  // ---------------------------------------------------------------------------
  // Auto-save draft every 30 s
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isDirty || !initialArticle?.id) return;
    if (initialArticle.status !== ARTICLE_STATUS.DRAFT) return;

    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);

    draftSaveTimer.current = setTimeout(async () => {
      const snapshot = JSON.stringify(formData);
      if (snapshot === lastSavedDraftRef.current) return;

      setIsAutoSaving(true);
      try {
        const res = await fetch(`/api/publication/${initialArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            body: formData.body,
            excerpt: formData.excerpt || null,
            section: formData.section,
          }),
        });
        if (res.ok) {
          lastSavedDraftRef.current = snapshot;
          setSuccessMessage('Draft auto-saved');
          setTimeout(() => setSuccessMessage(null), 2000);
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 30_000);

    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [isDirty, formData, initialArticle]);

  // ---------------------------------------------------------------------------
  // Submit (create or update)
  // ---------------------------------------------------------------------------

  const handleSaveDraft = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        setErrorMessage('Please fix the errors below');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const isEdit = !!initialArticle?.id;
        const method = isEdit ? 'PATCH' : 'POST';
        const endpoint = isEdit ? `/api/publication/${initialArticle.id}` : '/api/publication';

        const payload: Record<string, unknown> = {
          title: formData.title,
          body: formData.body,
          excerpt: formData.excerpt || null,
          section: formData.section,
        };
        if (!isEdit && formData.byline_name) {
          payload.byline_name = formData.byline_name;
        }

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error?.message ?? 'Failed to save article');
        }

        const { data: savedArticle } = await res.json();
        setIsDirty(false);
        setSuccessMessage(isEdit ? 'Article updated' : 'Draft created');
        onSuccess?.(savedArticle);

        if (!isEdit) {
          router.push(`/news/${savedArticle.slug}/edit`);
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to save article');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, initialArticle, onSuccess, router, validateForm]
  );

  // ---------------------------------------------------------------------------
  // Workflow transitions
  // ---------------------------------------------------------------------------

  const submitForReview = useCallback(async () => {
    if (!initialArticle?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/publication/${initialArticle.id}/submit`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? 'Failed to submit for review');
      }
      const { data } = await res.json();
      setSuccessMessage('Article submitted for review');
      onSuccess?.(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setIsSubmitting(false);
    }
  }, [initialArticle, onSuccess]);

  const handleReset = useCallback(() => {
    setFormData(defaultFormState);
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDirty(false);
  }, [defaultFormState]);

  return {
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
    handleReset,
    validateForm,
  };
}
