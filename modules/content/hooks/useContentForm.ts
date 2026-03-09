'use client';

import type { IContent } from '@/shared/types/database.types';
import type { ContentTag } from '@/shared/constants/tags';
import {
  announcementSchema,
  type AnnouncementFormData,
} from '@/modules/content/schemas/content.schema';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseContentFormOptions {
  initialContent?: IContent | null;
  onSuccess?: (content: IContent) => void;
}

interface FormState {
  title: string;
  body: string;
  visibility: 'PUBLIC' | 'ORG_ONLY' | 'DEPT_ONLY';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  org_ids: string[];
  tags: ContentTag[];
  scheduled_at: string | null;
}

interface FormErrors {
  [key: string]: string;
}

type FormFieldName = keyof FormState;

/**
 * Hook for managing content form state, validation, and submission
 * Handles both create and update operations with draft auto-save
 */
export function useContentForm(options: UseContentFormOptions = {}) {
  const router = useRouter();
  const { initialContent, onSuccess } = options;

  // Initialize form state from initial content or defaults
  const defaultFormState = useMemo<FormState>(
    () => ({
      title: initialContent?.title || '',
      body: initialContent?.body || '',
      visibility: (initialContent?.visibility || 'PUBLIC') as FormState['visibility'],
      status: (initialContent?.status || 'DRAFT') as FormState['status'],
      org_ids: [],
      tags: initialContent?.tags || [],
      scheduled_at: initialContent?.scheduled_at || null,
    }),
    [initialContent]
  );

  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const draftSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDraftRef = useRef<string>('');

  useEffect(() => {
    setFormData(defaultFormState);
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDirty(false);
    lastSavedDraftRef.current = '';
  }, [defaultFormState]);

  const setFieldValue = useCallback(<K extends FormFieldName>(name: K, value: FormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  }, []);

  /**
   * Validate form data using Zod schema
   */
  const validateForm = useCallback((): boolean => {
    const validationData: Partial<AnnouncementFormData> = {
      title: formData.title,
      body: formData.body,
      visibility: formData.visibility,
      status: formData.status,
      org_ids: formData.org_ids,
      tags: formData.tags,
      scheduled_at: formData.scheduled_at,
    };

    const result = announcementSchema.safeParse(validationData);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  /**
   * Handle form field changes
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.currentTarget;
      const { name, value } = target;

      if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        const fieldName = name as 'org_ids' | 'tags';
        const currentArray = formData[fieldName];
        const nextValue = target.checked
          ? [...currentArray, value]
          : currentArray.filter((item) => item !== value);

        setFieldValue(fieldName, nextValue);
        return;
      }

      switch (name as FormFieldName) {
        case 'title':
        case 'body':
          setFieldValue(name as 'title' | 'body', value);
          break;
        case 'visibility':
          setFieldValue('visibility', value as FormState['visibility']);
          break;
        case 'status':
          setFieldValue('status', value as FormState['status']);
          break;
        case 'scheduled_at':
          setFieldValue('scheduled_at', value || null);
          break;
        default:
          break;
      }
    },
    [formData, setFieldValue]
  );

  /**
   * Handle body input with character count
   */
  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFieldValue('body', e.target.value);
    },
    [setFieldValue]
  );

  /**
   * Handle tag input (comma-separated)
   */
  // Removed - tags are now handled via toggleTag in ContentForm component

  /**
   * Auto-save draft every 30 seconds if dirty
   */
  useEffect(() => {
    if (!isDirty) return;

    // Cancel previous timer if it exists
    if (draftSaveTimer.current) {
      clearTimeout(draftSaveTimer.current);
    }

    // Set new timer for auto-save
    draftSaveTimer.current = setTimeout(async () => {
      const draftData = JSON.stringify(formData);

      // Only save if content has changed since last save
      if (draftData === lastSavedDraftRef.current) {
        return;
      }

      setIsAutoSaving(true);
      try {
        // Check if this is a new content or update
        const method = initialContent?.id ? 'PATCH' : 'POST';
        const endpoint = initialContent?.id ? `/api/content/${initialContent.id}` : '/api/content';

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            status: 'DRAFT',
          }),
        });

        if (response.ok) {
          lastSavedDraftRef.current = draftData;
          setSuccessMessage('Draft auto-saved');
          setTimeout(() => setSuccessMessage(null), 2000);
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 30000); // 30 second delay

    return () => {
      if (draftSaveTimer.current) {
        clearTimeout(draftSaveTimer.current);
      }
    };
  }, [isDirty, formData, initialContent?.id]);

  /**
   * Submit form (create or update)
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent, submitStatus: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'DRAFT') => {
      e.preventDefault();

      if (!validateForm()) {
        setErrorMessage('Please fix the errors below');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const method = initialContent?.id ? 'PATCH' : 'POST';
        const endpoint = initialContent?.id ? `/api/content/${initialContent.id}` : '/api/content';

        const payload = {
          title: formData.title,
          body: formData.body,
          visibility: formData.visibility,
          status: submitStatus,
          org_ids: formData.org_ids,
          tags: formData.tags,
          ...(submitStatus === 'SCHEDULED' &&
            formData.scheduled_at && {
              scheduled_at: formData.scheduled_at,
            }),
        };

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to save content');
        }

        setSuccessMessage(
          initialContent?.id
            ? 'Content updated successfully'
            : `Content ${submitStatus === 'PUBLISHED' ? 'published' : 'saved as draft'}`
        );
        setIsDirty(false);

        if (onSuccess) {
          onSuccess(data.data);
        }

        // Redirect after short delay to show success message
        setTimeout(() => {
          router.push(`/content/${data.data.slug}`);
        }, 1000);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, initialContent?.id, validateForm, onSuccess, router]
  );

  /**
   * Handle save as draft button
   */
  const handleSaveDraft = useCallback(
    (e: React.FormEvent) => {
      handleSubmit(e, 'DRAFT');
    },
    [handleSubmit]
  );

  /**
   * Handle publish button
   */
  const handlePublish = useCallback(
    (e: React.FormEvent) => {
      handleSubmit(e, 'PUBLISHED');
    },
    [handleSubmit]
  );

  /**
   * Handle schedule button
   */
  const handleSchedule = useCallback(
    (e: React.FormEvent) => {
      if (!formData.scheduled_at) {
        setErrorMessage('Please select a date and time to schedule');
        return;
      }
      handleSubmit(e, 'SCHEDULED');
    },
    [formData.scheduled_at, handleSubmit]
  );

  /**
   * Reset form to initial state
   */
  const handleReset = useCallback(() => {
    setFormData(defaultFormState);
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDirty(false);
    lastSavedDraftRef.current = '';
  }, [defaultFormState]);

  return {
    // State
    formData,
    errors,
    isSubmitting,
    isAutoSaving,
    successMessage,
    errorMessage,
    isDirty,

    // Handlers
    handleChange,
    handleBodyChange,
    handleSubmit,
    handleSaveDraft,
    handlePublish,
    handleSchedule,
    handleReset,
    setFieldValue,
    validateForm,
  };
}
