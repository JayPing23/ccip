/**
 * Publication Constants
 * Statuses and sections for the campus publication module.
 * These are separate from announcement statuses in modules/content.
 */

export const ARTICLE_STATUS = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ArticleStatus = (typeof ARTICLE_STATUS)[keyof typeof ARTICLE_STATUS];

export const ARTICLE_SECTIONS = {
  NEWS: 'NEWS',
  FEATURES: 'FEATURES',
  OPINION: 'OPINION',
  EDITORIAL: 'EDITORIAL',
  SPORTS: 'SPORTS',
  CULTURE: 'CULTURE',
} as const;

export type ArticleSection = (typeof ARTICLE_SECTIONS)[keyof typeof ARTICLE_SECTIONS];

export const ARTICLE_SECTION_LABELS: Record<ArticleSection, string> = {
  NEWS: 'News',
  FEATURES: 'Features',
  OPINION: 'Opinion',
  EDITORIAL: 'Editorial',
  SPORTS: 'Sports',
  CULTURE: 'Culture',
};
