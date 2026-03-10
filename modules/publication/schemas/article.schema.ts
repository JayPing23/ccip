import { ARTICLE_SECTIONS, ARTICLE_STATUS } from '@/modules/publication/constants';
import { z } from 'zod';

const sectionValues = Object.values(ARTICLE_SECTIONS) as [string, ...string[]];
const statusValues = Object.values(ARTICLE_STATUS) as [string, ...string[]];

export const articleCreateSchema = z.object({
  title: z.string().min(3).max(300),
  body: z.string().max(50000).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  section: z.enum(sectionValues),
  status: z.enum(statusValues).optional(),
  byline_name: z.string().min(1).max(200).optional(),
});

export type ArticleCreateData = z.infer<typeof articleCreateSchema>;

export const articleUpdateSchema = articleCreateSchema.partial();

export type ArticleUpdateData = z.infer<typeof articleUpdateSchema>;
