// ---------------------------------------------------------------------------
// Moderation Constants
// ---------------------------------------------------------------------------

export const REPORT_REASON = {
  SPAM: 'SPAM',
  HARASSMENT: 'HARASSMENT',
  MISINFORMATION: 'MISINFORMATION',
  OFF_TOPIC: 'OFF_TOPIC',
  INAPPROPRIATE: 'INAPPROPRIATE',
  OTHER: 'OTHER',
} as const;

export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  MISINFORMATION: 'Misinformation',
  OFF_TOPIC: 'Off Topic',
  INAPPROPRIATE: 'Inappropriate',
  OTHER: 'Other',
};

export const REPORT_STATUS = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED',
  ACTIONED: 'ACTIONED',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const MODERATION_ACTION_TYPE = {
  HIDE: 'HIDE',
  LOCK: 'LOCK',
  REMOVE: 'REMOVE',
  WARN: 'WARN',
} as const;

export type ModerationActionType =
  (typeof MODERATION_ACTION_TYPE)[keyof typeof MODERATION_ACTION_TYPE];

export const REPORTABLE_CONTENT_TYPE = {
  THREAD: 'THREAD',
  REPLY: 'REPLY',
} as const;

export type ReportableContentType =
  (typeof REPORTABLE_CONTENT_TYPE)[keyof typeof REPORTABLE_CONTENT_TYPE];

export const RESTRICTION_TYPE = {
  MUTED: 'MUTED',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const;

export type RestrictionType = (typeof RESTRICTION_TYPE)[keyof typeof RESTRICTION_TYPE];

export const RESTRICTION_TYPE_LABELS: Record<RestrictionType, string> = {
  MUTED: 'Muted',
  SUSPENDED: 'Suspended',
  BANNED: 'Banned',
};
