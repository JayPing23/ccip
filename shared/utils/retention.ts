/**
 * Retention Utilities (Phase 5)
 * Content lifecycle management for managed content across all pillars.
 * Identifies stale content and applies retention policies.
 */

import { createServiceRoleClient } from '@/shared/lib/supabase-server';

// ---------------------------------------------------------------------------
// Retention policy types
// ---------------------------------------------------------------------------

export type RetentionContentType = 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';

export type RetentionAction = 'ARCHIVE' | 'FLAG_STALE' | 'NONE';

export interface IRetentionPolicy {
  id: string;
  content_type: RetentionContentType;
  stale_after_days: number;
  auto_archive_after_days: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetentionCandidate {
  id: string;
  content_type: RetentionContentType;
  title: string;
  status: string;
  last_activity_at: string;
  age_days: number;
  recommended_action: RetentionAction;
}

export interface RetentionSummary {
  totalStale: number;
  totalArchivable: number;
  candidates: RetentionCandidate[];
}

// ---------------------------------------------------------------------------
// Default retention thresholds (in days)
// ---------------------------------------------------------------------------

export const RETENTION_DEFAULTS: Record<
  RetentionContentType,
  { staleDays: number; archiveDays: number | null }
> = {
  ANNOUNCEMENT: { staleDays: 90, archiveDays: 180 },
  ARTICLE: { staleDays: 365, archiveDays: null },
  THREAD: { staleDays: 180, archiveDays: null },
} as const;

// ---------------------------------------------------------------------------
// Fetch active retention policies from the database
// ---------------------------------------------------------------------------

export async function getRetentionPolicies(): Promise<IRetentionPolicy[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('retention_policies')
    .select('*')
    .eq('enabled', true)
    .order('content_type');

  if (error) {
    console.error('[Retention] Failed to load policies', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Update a retention policy
// ---------------------------------------------------------------------------

export async function updateRetentionPolicy(
  id: string,
  updates: Partial<
    Pick<IRetentionPolicy, 'stale_after_days' | 'auto_archive_after_days' | 'enabled'>
  >
): Promise<IRetentionPolicy | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('retention_policies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Retention] Failed to update policy', error);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Identify stale / archivable content across all pillars
// ---------------------------------------------------------------------------

export async function getRetentionCandidates(): Promise<RetentionSummary> {
  const policies = await getRetentionPolicies();
  const candidates: RetentionCandidate[] = [];

  for (const policy of policies) {
    const items = await findCandidatesForType(policy);
    candidates.push(...items);
  }

  return {
    totalStale: candidates.filter((c) => c.recommended_action === 'FLAG_STALE').length,
    totalArchivable: candidates.filter((c) => c.recommended_action === 'ARCHIVE').length,
    candidates,
  };
}

async function findCandidatesForType(policy: IRetentionPolicy): Promise<RetentionCandidate[]> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const staleCutoff = new Date(now);
  staleCutoff.setDate(staleCutoff.getDate() - policy.stale_after_days);

  const archiveCutoff = policy.auto_archive_after_days
    ? new Date(now.getTime() - policy.auto_archive_after_days * 86_400_000)
    : null;

  const tableConfig = TABLE_MAP[policy.content_type];
  if (!tableConfig) return [];

  const { data, error } = await supabase
    .from(tableConfig.table)
    .select('id, title, status, updated_at')
    .is('deleted_at', null)
    .in('status', tableConfig.activeStatuses)
    .lte('updated_at', staleCutoff.toISOString())
    .order('updated_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error(`[Retention] Query failed for ${policy.content_type}`, error);
    return [];
  }

  return (data ?? []).map((row) => {
    const lastActivity = new Date(row.updated_at);
    const ageDays = Math.floor((now.getTime() - lastActivity.getTime()) / 86_400_000);

    let recommended: RetentionAction = 'FLAG_STALE';
    if (archiveCutoff && lastActivity <= archiveCutoff) {
      recommended = 'ARCHIVE';
    }

    return {
      id: row.id as string,
      content_type: policy.content_type,
      title: row.title as string,
      status: row.status as string,
      last_activity_at: row.updated_at as string,
      age_days: ageDays,
      recommended_action: recommended,
    };
  });
}

// ---------------------------------------------------------------------------
// Archive stale content by IDs (per content type)
// ---------------------------------------------------------------------------

export async function archiveStaleContent(
  contentType: RetentionContentType,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;

  const supabase = createServiceRoleClient();
  const tableConfig = TABLE_MAP[contentType];
  if (!tableConfig) return 0;

  const { data, error } = await supabase
    .from(tableConfig.table)
    .update({ status: tableConfig.archiveStatus, updated_at: new Date().toISOString() })
    .in('id', ids)
    .select('id');

  if (error) {
    console.error(`[Retention] Archive failed for ${contentType}`, error);
    return 0;
  }

  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Table mapping for multi-pillar queries
// ---------------------------------------------------------------------------

const TABLE_MAP: Record<
  RetentionContentType,
  { table: string; activeStatuses: string[]; archiveStatus: string }
> = {
  ANNOUNCEMENT: {
    table: 'content',
    activeStatuses: ['PUBLISHED', 'SCHEDULED'],
    archiveStatus: 'ARCHIVED',
  },
  ARTICLE: {
    table: 'articles',
    activeStatuses: ['PUBLISHED', 'APPROVED'],
    archiveStatus: 'ARCHIVED',
  },
  THREAD: {
    table: 'forum_threads',
    activeStatuses: ['OPEN'],
    archiveStatus: 'LOCKED',
  },
};
