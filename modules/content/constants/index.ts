export const ANNOUNCEMENT_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];

export const ANNOUNCEMENT_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  ORG_ONLY: 'ORG_ONLY',
  DEPT_ONLY: 'DEPT_ONLY',
} as const;

export type AnnouncementVisibility =
  (typeof ANNOUNCEMENT_VISIBILITY)[keyof typeof ANNOUNCEMENT_VISIBILITY];
