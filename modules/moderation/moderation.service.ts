/**
 * Moderation Service
 * Handles all database interactions for the moderation module:
 *   P4-07 — reports, queue review, moderation actions, and user restrictions
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase-server';
import { REPORT_STATUS } from '@/modules/moderation/constants';
import type { ReportStatus } from '@/modules/moderation/constants';
import type {
  IModerationReport,
  IModerationAction,
  IUserRestriction,
  CreateReportInput,
  ReportQueueFilters,
  CreateModerationActionInput,
  CreateRestrictionInput,
} from '@/modules/moderation/types';

// ===========================================================================
// Audit helper
// ===========================================================================

async function logAuditEvent(
  tableName: string,
  recordId: string,
  action: string,
  userId: string,
  before: object | null,
  after: object | null
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    user_id: userId,
    diff: { before, after },
  });

  if (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ===========================================================================
// Reports
// ===========================================================================

/** Create a new moderation report. */
export async function createReport(input: CreateReportInput): Promise<IModerationReport> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('moderation_reports')
    .insert({
      reporter_id: input.reporter_id,
      content_type: input.content_type,
      content_id: input.content_id,
      reason: input.reason,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const report = data as IModerationReport;

  await logAuditEvent('moderation_reports', report.id, 'INSERT', input.reporter_id, null, report);
  return report;
}

/** Get a single report by ID. */
export async function getReportById(reportId: string): Promise<IModerationReport | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('moderation_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? (data as IModerationReport) : null;
}

// ===========================================================================
// Report queue
// ===========================================================================

/** Get the moderation report queue, optionally filtered by status / content type. */
export async function getReportQueue(
  filters: ReportQueueFilters = {}
): Promise<IModerationReport[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('moderation_reports')
    .select('*')
    .order('created_at', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default: show pending reports first
    query = query.eq('status', REPORT_STATUS.PENDING);
  }

  if (filters.content_type) {
    query = query.eq('content_type', filters.content_type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as IModerationReport[];
}

/** Review a report — update its status and record who reviewed it. */
export async function reviewReport(
  reportId: string,
  moderatorId: string,
  newStatus: ReportStatus
): Promise<IModerationReport> {
  const supabase = createServiceRoleClient();

  const before = await getReportById(reportId);
  if (!before) throw new Error('Report not found');

  const { data, error } = await supabase
    .from('moderation_reports')
    .update({
      status: newStatus,
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const report = data as IModerationReport;

  await logAuditEvent('moderation_reports', reportId, 'UPDATE', moderatorId, before, report);
  return report;
}

// ===========================================================================
// Moderation actions
// ===========================================================================

/** Create a moderation action (hide, lock, remove, warn). */
export async function createModerationAction(
  input: CreateModerationActionInput
): Promise<IModerationAction> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: input.moderator_id,
      report_id: input.report_id ?? null,
      content_type: input.content_type,
      content_id: input.content_id,
      action: input.action,
      reason: input.reason,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const action = data as IModerationAction;

  await logAuditEvent('moderation_actions', action.id, 'INSERT', input.moderator_id, null, action);
  return action;
}

/** Get moderation action history, optionally filtered by content. */
export async function getModerationActions(
  contentType?: string,
  contentId?: string
): Promise<IModerationAction[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('moderation_actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (contentType) query = query.eq('content_type', contentType);
  if (contentId) query = query.eq('content_id', contentId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as IModerationAction[];
}

// ===========================================================================
// User restrictions
// ===========================================================================

/** Create a user restriction (mute, suspend, ban). */
export async function createRestriction(input: CreateRestrictionInput): Promise<IUserRestriction> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('user_restrictions')
    .insert({
      user_id: input.user_id,
      restriction_type: input.restriction_type,
      reason: input.reason,
      issued_by: input.issued_by,
      expires_at: input.expires_at ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const restriction = data as IUserRestriction;

  await logAuditEvent(
    'user_restrictions',
    restriction.id,
    'INSERT',
    input.issued_by,
    null,
    restriction
  );
  return restriction;
}

/** Get all active (non-revoked, non-expired) restrictions for a user. */
export async function getActiveRestrictions(userId: string): Promise<IUserRestriction[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_restrictions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as IUserRestriction[];
}

/** Revoke a restriction. */
export async function revokeRestriction(
  restrictionId: string,
  moderatorId: string
): Promise<IUserRestriction> {
  const supabase = createServiceRoleClient();

  const { data: before, error: findError } = await supabase
    .from('user_restrictions')
    .select('*')
    .eq('id', restrictionId)
    .single();

  if (findError && findError.code !== 'PGRST116') throw new Error(findError.message);
  if (!before) throw new Error('Restriction not found');

  const { data, error } = await supabase
    .from('user_restrictions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', restrictionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const restriction = data as IUserRestriction;

  await logAuditEvent(
    'user_restrictions',
    restrictionId,
    'UPDATE',
    moderatorId,
    before as IUserRestriction,
    restriction
  );
  return restriction;
}
