// ---------------------------------------------------------------------------
// Forum Constants
// ---------------------------------------------------------------------------

export const THREAD_STATUS = {
  OPEN: 'OPEN',
  LOCKED: 'LOCKED',
  HIDDEN: 'HIDDEN',
  REMOVED: 'REMOVED',
} as const;

export type ThreadStatus = (typeof THREAD_STATUS)[keyof typeof THREAD_STATUS];

export const THREAD_STATUS_LABELS: Record<ThreadStatus, string> = {
  OPEN: 'Open',
  LOCKED: 'Locked',
  HIDDEN: 'Hidden',
  REMOVED: 'Removed',
};

export const REPLY_STATUS = {
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN',
  REMOVED: 'REMOVED',
} as const;

export type ReplyStatus = (typeof REPLY_STATUS)[keyof typeof REPLY_STATUS];

export const REACTION_TYPE = {
  LIKE: 'LIKE',
  HELPFUL: 'HELPFUL',
  INSIGHTFUL: 'INSIGHTFUL',
} as const;

export type ReactionType = (typeof REACTION_TYPE)[keyof typeof REACTION_TYPE];

export const REACTION_TYPE_LABELS: Record<ReactionType, string> = {
  LIKE: 'Like',
  HELPFUL: 'Helpful',
  INSIGHTFUL: 'Insightful',
};
