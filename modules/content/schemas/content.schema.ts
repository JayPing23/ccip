import { ANNOUNCEMENT_STATUS, ANNOUNCEMENT_VISIBILITY } from '@/modules/content/constants';
import { CONTENT_TAGS } from '@/shared/constants/tags';
import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10000).optional(),
  description: z.string().min(10).max(10000).optional(),
  status: z
    .enum([
      ANNOUNCEMENT_STATUS.DRAFT,
      ANNOUNCEMENT_STATUS.SCHEDULED,
      ANNOUNCEMENT_STATUS.PUBLISHED,
      ANNOUNCEMENT_STATUS.ARCHIVED,
    ])
    .optional(),
  visibility: z.enum([
    ANNOUNCEMENT_VISIBILITY.PUBLIC,
    ANNOUNCEMENT_VISIBILITY.ORG_ONLY,
    ANNOUNCEMENT_VISIBILITY.DEPT_ONLY,
  ]),
  org_ids: z.array(z.string().uuid()).optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
  tags: z.array(z.enum(CONTENT_TAGS)).optional(),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;

export const announcementFilterSchema = z.object({
  org_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  tags: z.array(z.enum(CONTENT_TAGS)).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AnnouncementFilterData = z.infer<typeof announcementFilterSchema>;
