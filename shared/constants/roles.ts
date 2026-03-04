// DO NOT change these string values — they match the database seed data

export const ROLES = {
  STUDENT:           'STUDENT',
  DEPT_EDITOR:       'DEPT_EDITOR',
  UNIVERSITY_EDITOR: 'UNIVERSITY_EDITOR',
  SUPER_ADMIN:       'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
