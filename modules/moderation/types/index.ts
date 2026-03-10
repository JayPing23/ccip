import type {
  ModerationActionType,
  ReportableContentType,
  ReportReason,
  ReportStatus,
  RestrictionType,
} from '@/modules/moderation/constants';

export interface IModerationReport {
  id: string;
  reporter_id: string;
  content_type: ReportableContentType;
  content_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface IModerationAction {
  id: string;
  moderator_id: string;
  report_id: string | null;
  content_type: ReportableContentType;
  content_id: string;
  action: ModerationActionType;
  reason: string;
  created_at: string;
}

export interface IUserRestriction {
  id: string;
  user_id: string;
  restriction_type: RestrictionType;
  reason: string;
  issued_by: string;
  starts_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Service input / option types
// ---------------------------------------------------------------------------

export interface CreateReportInput {
  reporter_id: string;
  content_type: ReportableContentType;
  content_id: string;
  reason: ReportReason;
  description?: string | null;
}

export interface ReportQueueFilters {
  status?: ReportStatus;
  content_type?: ReportableContentType;
}

export interface CreateModerationActionInput {
  moderator_id: string;
  report_id?: string | null;
  content_type: ReportableContentType;
  content_id: string;
  action: ModerationActionType;
  reason: string;
}

export interface CreateRestrictionInput {
  user_id: string;
  restriction_type: RestrictionType;
  reason: string;
  issued_by: string;
  expires_at?: string | null;
}
