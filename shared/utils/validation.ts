/**
 * Shared Validation Schemas
 * Runtime validation for cross-module payloads only.
 */

import { z } from 'zod';

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
