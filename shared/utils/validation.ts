/**
 * Validation Schemas
 * Zod schemas for all form data and API inputs
 */

import { CONTENT_STATUS, CONTENT_VISIBILITY } from '@/shared/constants/content';
import { CONTENT_TAGS } from '@/shared/constants/tags';
import { z } from 'zod';

/**
 * Content Creation/Update Schema
 */
export const contentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000).optional(), // Accept description from form
  body: z.string().min(10).max(10000).optional(), // Accept body from API
  status: z
    .enum([
      CONTENT_STATUS.DRAFT,
      CONTENT_STATUS.SCHEDULED,
      CONTENT_STATUS.PUBLISHED,
      CONTENT_STATUS.ARCHIVED,
    ])
    .optional(),
  visibility: z.enum([
    CONTENT_VISIBILITY.PUBLIC,
    CONTENT_VISIBILITY.ORG_ONLY,
    CONTENT_VISIBILITY.DEPT_ONLY,
  ]),
  org_ids: z.array(z.string().uuid()).optional(), // Make optional for simple form
  scheduled_at: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(), // Accept array of strings, not enums
});

export type ContentFormData = z.infer<typeof contentSchema>;

/**
 * User Profile Update Schema
 */
export const userProfileSchema = z.object({
  display_name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional().nullable(),
});

export type UserProfileData = z.infer<typeof userProfileSchema>;

/**
 * File Upload Schema
 */
export const fileUploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_type: z.enum(['image', 'pdf', 'document']),
  file_size_bytes: z.number().int().positive(),
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;

/**
 * Query Validation Schemas
 */

export const contentFilterSchema = z.object({
  org_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  tags: z.array(z.enum(CONTENT_TAGS)).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ContentFilterData = z.infer<typeof contentFilterSchema>;
