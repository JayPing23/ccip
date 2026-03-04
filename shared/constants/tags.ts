export const CONTENT_TAGS = [
  'general',
  'events',
  'enrollment',
  'scholarship',
  'deadline',
  'academic',
  'extracurricular',
  'emergency',
  'facility',
  'career',
] as const;

export type ContentTag = typeof CONTENT_TAGS[number];
