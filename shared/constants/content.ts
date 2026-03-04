export const CONTENT_STATUS = {
  DRAFT:     'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED:  'ARCHIVED',
} as const;

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS];

export const CONTENT_VISIBILITY = {
  PUBLIC:    'PUBLIC',
  ORG_ONLY:  'ORG_ONLY',
  DEPT_ONLY: 'DEPT_ONLY',
} as const;

export type ContentVisibility = typeof CONTENT_VISIBILITY[keyof typeof CONTENT_VISIBILITY];
